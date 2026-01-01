# Feature Specification: Multi-Country Support & Task Deduplication

**Status:** Draft  
**Date:** 2026-01-02  
**Author:** Winston (Architect Agent)  
**Related Specs:** `feature-program-logic.md`

---

## 1. Context & Problem Statement

### Current State
The system currently supports a **single country** per student via `Student.countryId` (string, nullable). This works for simple use cases where a student applies to universities in one country only.

### The Challenge
Real-world students often apply to multiple countries simultaneously (e.g., Austria + Italy + Germany). Each country has its own set of required documents and processes:

- **Austria requires:** Passport, Diploma with Apostille, Translations
- **Italy requires:** Passport, Diploma with Apostille, Photo
- **Germany requires:** Passport, Certificate, Language Test

**Problem:** The current single-country model forces students to choose one country, making multi-country applications impossible.

**Additional Complexity:** Many documents are **universal** (e.g., Passport is needed by all three countries). If we naively create tasks per country, we'd generate duplicate "Upload Passport" tasks for each country, creating confusion and poor UX.

### Solution Goals
1. **Multi-Country Selection:** Allow students to apply to multiple countries.
2. **Smart Task Deduplication:** Prevent creating duplicate tasks for universal documents.
3. **Maintain Context:** Tasks should still know which country/program they belong to when needed.

---

## 2. Database Migration & Schema Changes

### 2.1. Deprecate `Student.countryId` (Single Country)

**Current Schema:**
```typescript
@Entity('students')
export class Student {
  @Column({ nullable: true })
  countryId?: string; // DEPRECATED: 'at', 'it', etc.
}
```

**Migration Strategy:**
1. **Phase 1 (Backward Compatible):** Keep `countryId` but mark as deprecated in code comments.
2. **Phase 2 (Data Migration):** Create migration script to:
   - For each student with `countryId != null`, create a `StudentCountry` record.
   - Set `countryId = null` after successful migration.
3. **Phase 3 (Cleanup):** After verifying all data is migrated, drop the column in a future version.

**Migration SQL:**
```sql
-- Step 1: Create migration records
INSERT INTO student_countries (student_id, country_id, enrolled_at)
SELECT id, country_id, NOW()
FROM students
WHERE country_id IS NOT NULL;

-- Step 2: Verify migration
SELECT COUNT(*) FROM students WHERE country_id IS NOT NULL
  AND id NOT IN (SELECT student_id FROM student_countries);

-- Step 3: Null out deprecated column (after verification)
UPDATE students SET country_id = NULL WHERE country_id IS NOT NULL;

-- Step 4: Drop column (future migration)
-- ALTER TABLE students DROP COLUMN country_id;
```

### 2.2. Create Many-to-Many Relation: `Student ↔ Country`

**New Join Table Entity:**
```typescript
// apps/api/src/entities/student-country.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Student } from './student.entity';
import { Country } from './country.entity';

@Entity('student_countries')
export class StudentCountry {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  studentId!: string;

  @ManyToOne(() => Student, (s) => s.countries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @Column()
  countryId!: string;

  @ManyToOne(() => Country, (c) => c.students)
  @JoinColumn({ name: 'countryId' })
  country!: Country;

  @Column({ default: 'active' }) // 'active', 'removed', 'completed'
  status!: string;

  @CreateDateColumn()
  enrolledAt!: Date;

  // Composite unique constraint to prevent duplicate entries
  // Add to entity via @Index or migration:
  // CREATE UNIQUE INDEX idx_student_country_unique ON student_countries(student_id, country_id);
}
```

**Update Student Entity:**
```typescript
// apps/api/src/entities/student.entity.ts

@Entity('students')
export class Student {
  // ... existing fields ...

  /**
   * @deprecated Use `countries` relation instead. Will be removed in v2.0.
   */
  @Column({ nullable: true })
  countryId?: string;

  @OneToMany(() => StudentCountry, (sc) => sc.student)
  countries!: StudentCountry[];
}
```

**Update Country Entity:**
```typescript
// apps/api/src/entities/country.entity.ts

@Entity('countries')
export class Country {
  // ... existing fields ...

  @OneToMany(() => StudentCountry, (sc) => sc.country)
  students!: StudentCountry[];
}
```

---

## 3. UI Impact: Dropdown → Multi-Select Tag List

### 3.1. Current UI (Single Select Dropdown)
```tsx
// Current implementation (deprecated)
<Select value={student.countryId} onChange={handleCountryChange}>
  <option value="at">🇦🇹 Austria</option>
  <option value="it">🇮🇹 Italy</option>
  <option value="de">🇩🇪 Germany</option>
</Select>
```

### 3.2. New UI (Multi-Select Tag List)

**Component Specification:**
- **Library:** Use Shadcn UI `<MultiSelect>` or custom tag input component.
- **Display:** Show selected countries as dismissible tags with flag icons.
- **Interaction:**
  - Click tag's X button → Remove country (triggers API call).
  - Click "Add Country" → Dropdown with remaining countries.
  - Limit: No validation limit (students can apply to all countries if needed).

**Example Implementation:**
```tsx
// apps/web/src/components/CountryMultiSelect.tsx

import { Badge } from '@/components/ui/badge';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';

interface CountryMultiSelectProps {
  studentId: string;
  selectedCountries: { id: string; name: string; flagIcon: string }[];
  availableCountries: { id: string; name: string; flagIcon: string }[];
  onAdd: (countryId: string) => Promise<void>;
  onRemove: (countryId: string) => Promise<void>;
}

export function CountryMultiSelect({
  studentId,
  selectedCountries,
  availableCountries,
  onAdd,
  onRemove,
}: CountryMultiSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Target Countries</label>
      
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2">
        {selectedCountries.map((country) => (
          <Badge key={country.id} variant="secondary" className="px-3 py-1">
            <span className="mr-2">{country.flagIcon}</span>
            {country.name}
            <button
              onClick={() => onRemove(country.id)}
              className="ml-2 text-gray-500 hover:text-red-600"
            >
              ✕
            </button>
          </Badge>
        ))}
      </div>

      {/* Add Country Dropdown */}
      <Command>
        <CommandGroup heading="Add Country">
          {availableCountries.map((country) => (
            <CommandItem
              key={country.id}
              onSelect={() => onAdd(country.id)}
            >
              <span className="mr-2">{country.flagIcon}</span>
              {country.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </Command>
    </div>
  );
}
```

**API Integration:**
- **Add Country:** `POST /api/students/:studentId/countries` with `{ "countryId": "at" }`
- **Remove Country:** `DELETE /api/students/:studentId/countries/:countryId`

---

## 4. Universal vs. Specific Task Logic (Deduplication)

### 4.1. The Problem

**Scenario:**
- Student selects Austria + Italy.
- Austria has TaskTemplates: `[Passport, Diploma-Apostille, Translations]`
- Italy has TaskTemplates: `[Passport, Diploma-Apostille, Photo]`

**Naive Approach (BAD):**
Create 6 tasks:
1. Upload Passport (Austria)
2. Upload Diploma-Apostille (Austria)
3. Upload Translations (Austria)
4. Upload Passport (Italy) ← **DUPLICATE!**
5. Upload Diploma-Apostille (Italy) ← **DUPLICATE!**
6. Upload Photo (Italy)

**Problem:** Student sees "Upload Passport" twice. Confusing and redundant.

### 4.2. The Solution: Task Scope Flags

**Concept:**
- **Global Tasks:** Linked to a `DocumentTemplate` (e.g., Passport). One task per document type, shared across all countries.
- **Specific Tasks:** Linked to a specific Country, Program, or University (e.g., "Italy-specific Interview").

**Rule:**
When syncing tasks:
1. If `TaskTemplate` has a `documentTemplateId` → Check if student already has a task for that document.
   - **If YES:** Skip creating duplicate (reuse existing task).
   - **If NO:** Create new global task.
2. If `TaskTemplate` has no `documentTemplateId` but has `countryId`/`programId` → Create country/program-specific task.

### 4.3. Schema Updates

**Update TaskTemplate Entity:**
```typescript
// apps/api/src/entities/task-template.entity.ts

@Entity('task_templates')
export class TaskTemplate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  countryId?: string;

  @Column({ nullable: true })
  universityId?: string;

  @Column({ nullable: true })
  programId?: number;

  // --- NEW: Link to Document Template for Global Tasks ---
  @Column({ nullable: true })
  documentTemplateId?: number;

  @ManyToOne(() => DocumentTemplate, { nullable: true })
  @JoinColumn({ name: 'documentTemplateId' })
  documentTemplate?: DocumentTemplate;

  @Column()
  stage!: string;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column()
  xpReward!: number;

  @Column({ default: 'text' })
  submissionType!: string;

  // --- NEW: Scope Flag ---
  @Column({ 
    type: 'enum', 
    enum: ['global', 'country', 'program'], 
    default: 'country' 
  })
  scope!: 'global' | 'country' | 'program';
}
```

**Update Task Entity:**
```typescript
// apps/api/src/entities/task.entity.ts

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  companyId!: string;

  @Column()
  studentId!: string;

  @ManyToOne(() => Student, (student) => student.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  // --- NEW: Source Template Link ---
  @Column({ nullable: true })
  sourceTemplateId?: number;

  @ManyToOne(() => TaskTemplate, { nullable: true })
  @JoinColumn({ name: 'sourceTemplateId' })
  sourceTemplate?: TaskTemplate;

  // --- NEW: Document Template Link (for Global Tasks) ---
  @Column({ nullable: true })
  documentTemplateId?: number;

  @ManyToOne(() => DocumentTemplate, { nullable: true })
  @JoinColumn({ name: 'documentTemplateId' })
  documentTemplate?: DocumentTemplate;

  // --- NEW: Context Links (nullable for global tasks) ---
  @Column({ nullable: true })
  countryId?: string;

  @Column({ nullable: true })
  programId?: number;

  @Column()
  stage!: string;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column()
  xpReward!: number;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status!: TaskStatus;

  @Column('jsonb', { nullable: true })
  submission?: any;

  // --- NEW: Customization & Archival (from feature-program-logic.md) ---
  @Column({ default: false })
  isCustom!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt?: Date;
}
```

### 4.4. Task Sync Logic with Deduplication

**Service:** `apps/api/src/services/task-sync.service.ts`

**Pseudocode:**
```typescript
async syncStudentTasks(studentId: string): Promise<void> {
  const student = await studentRepo.findOne({
    where: { id: studentId },
    relations: ['countries', 'programs'],
  });

  // Gather all applicable TaskTemplates
  const templates = await this.getApplicableTemplates(student);

  for (const template of templates) {
    if (template.scope === 'global' && template.documentTemplateId) {
      // --- GLOBAL TASK: Check for Duplicate ---
      const existingTask = await taskRepo.findOne({
        where: {
          studentId,
          documentTemplateId: template.documentTemplateId,
        },
      });

      if (existingTask) {
        // Restore if archived
        if (existingTask.archivedAt) {
          existingTask.archivedAt = null;
          await taskRepo.save(existingTask);
        }
        continue; // Skip creating duplicate
      }

      // Create new global task
      const task = taskRepo.create({
        studentId,
        companyId: student.companyId,
        sourceTemplateId: template.id,
        documentTemplateId: template.documentTemplateId,
        title: template.title,
        description: template.description,
        stage: template.stage,
        xpReward: template.xpReward,
        status: TaskStatus.TODO,
        countryId: null, // Global task
        programId: null,
      });
      await taskRepo.save(task);

    } else {
      // --- COUNTRY/PROGRAM-SPECIFIC TASK ---
      const existingTask = await taskRepo.findOne({
        where: {
          studentId,
          sourceTemplateId: template.id,
          countryId: template.countryId,
          programId: template.programId,
        },
      });

      if (existingTask) {
        if (existingTask.archivedAt) {
          existingTask.archivedAt = null;
          await taskRepo.save(existingTask);
        }
        continue;
      }

      // Create new specific task
      const task = taskRepo.create({
        studentId,
        companyId: student.companyId,
        sourceTemplateId: template.id,
        documentTemplateId: null,
        title: template.title,
        description: template.description,
        stage: template.stage,
        xpReward: template.xpReward,
        status: TaskStatus.TODO,
        countryId: template.countryId,
        programId: template.programId,
      });
      await taskRepo.save(task);
    }
  }
}

private async getApplicableTemplates(student: Student): Promise<TaskTemplate[]> {
  const countryIds = student.countries.map(c => c.countryId);
  const programIds = student.selectedProgramIds;

  return await taskTemplateRepo.find({
    where: [
      { scope: 'global' }, // All global tasks
      { scope: 'country', countryId: In(countryIds) }, // Country-specific
      { scope: 'program', programId: In(programIds) }, // Program-specific
    ],
    relations: ['documentTemplate'],
  });
}
```

### 4.5. Deduplication Rules Summary

| Template Scope | Document Link | Deduplication Key | Example |
|----------------|---------------|-------------------|---------|
| **Global** | `documentTemplateId` | `(studentId, documentTemplateId)` | Passport (shared across all countries) |
| **Country** | None | `(studentId, countryId, sourceTemplateId)` | "Austria-specific Interview" |
| **Program** | None | `(studentId, programId, sourceTemplateId)` | "MIT-specific Essay" |

**Key Insight:** Global tasks are unique per document type, while specific tasks are unique per country/program context.

---

## 5. API Contracts

### 5.1. Add Country to Student
**Endpoint:** `POST /api/students/:studentId/countries`

**Request Payload:**
```json
{
  "countryId": "at"
}
```

**Response:**
```json
{
  "status": "added",
  "country": { "id": "at", "name": "Austria", "flagIcon": "🇦🇹" },
  "newTasksCount": 3,
  "message": "Successfully added Austria. 3 new tasks created."
}
```

**Business Logic:**
1. Validate `countryId` exists in `countries` table.
2. Check if relationship already exists (prevent duplicates).
3. Create `StudentCountry` record.
4. Trigger `TaskSyncService.syncStudentTasks(studentId)`.
5. Return count of new tasks created.

### 5.2. Remove Country from Student
**Endpoint:** `DELETE /api/students/:studentId/countries/:countryId`

**Response:**
```json
{
  "status": "removed",
  "tasksArchived": 2,
  "tasksDeleted": 5,
  "message": "Austria removed. 5 tasks deleted, 2 completed tasks archived."
}
```

**Business Logic:**
1. Find all tasks where `countryId = :countryId` AND `programId IS NULL` (country-specific tasks only).
2. Iterate through tasks:
   - If `status == TODO` AND `submission IS NULL` → **Hard Delete**.
   - Otherwise → **Soft Delete** (set `archivedAt = NOW()`).
3. Update `StudentCountry` status to `'removed'` (or delete record entirely).
4. Return counts.

**Note:** Global tasks (Passport) are NOT deleted when removing a country, since they might still be needed by other countries.

### 5.3. Get Student's Countries
**Endpoint:** `GET /api/students/:studentId/countries`

**Response:**
```json
{
  "countries": [
    { "id": "at", "name": "Austria", "flagIcon": "🇦🇹", "enrolledAt": "2026-01-01T12:00:00Z" },
    { "id": "it", "name": "Italy", "flagIcon": "🇮🇹", "enrolledAt": "2026-01-02T08:00:00Z" }
  ]
}
```

---

## 6. Data Seeding Strategy

### 6.1. TaskTemplate Seeding

**Example Seed Data:**
```typescript
// apps/api/src/database/seeds/task-templates.seed.ts

export const taskTemplates = [
  // --- GLOBAL TASKS (Document-based) ---
  {
    scope: 'global',
    documentTemplateId: 1, // Passport
    stage: 'documents',
    title: 'Upload Passport',
    description: 'Upload a color scan of your passport bio page.',
    xpReward: 50,
    submissionType: 'file',
  },
  {
    scope: 'global',
    documentTemplateId: 2, // Diploma with Apostille
    stage: 'documents',
    title: 'Upload Diploma (Apostille)',
    description: 'Upload diploma with apostille certification.',
    xpReward: 100,
    submissionType: 'file',
  },

  // --- COUNTRY-SPECIFIC TASKS (Austria) ---
  {
    scope: 'country',
    countryId: 'at',
    documentTemplateId: null,
    stage: 'interview',
    title: 'Austria Embassy Interview',
    description: 'Schedule and attend embassy interview in Austria.',
    xpReward: 200,
    submissionType: 'text',
  },

  // --- PROGRAM-SPECIFIC TASKS (MIT CS) ---
  {
    scope: 'program',
    programId: 101,
    documentTemplateId: null,
    stage: 'essay',
    title: 'MIT Essay: Why Computer Science?',
    description: 'Write a 500-word essay...',
    xpReward: 150,
    submissionType: 'text',
  },
];
```

### 6.2. Migration Script for Existing Data

**Goal:** Convert existing `countryId`-based tasks to new schema.

**Steps:**
1. For each existing task:
   - Find matching `TaskTemplate` by `(countryId, stage, title)`.
   - Set `sourceTemplateId = template.id`.
   - If template has `documentTemplateId`, set it on task.
2. Mark migration as complete in `migrations` table.

---

## 7. UI/UX Flow Examples

### 7.1. Curator Wizard: Creating Multi-Country Student

**Flow:**
1. **Step 1:** Enter student details (name, email).
2. **Step 2:** Select Countries (multi-select tag list).
   - Curator selects: Austria, Italy, Germany.
3. **Step 3:** Select Programs (filtered by selected countries).
   - Curator selects: Vienna University (Austria), Sapienza (Italy).
4. **Step 4:** Preview Changes.
   - UI shows: "Will create 12 tasks (3 global, 9 country/program-specific)."
5. **Confirm:** Create student → API calls sync service → Tasks generated.

**API Call:**
```typescript
POST /api/admin/students
{
  "fullName": "Alice Wonder",
  "email": "alice@example.com",
  "countryIds": ["at", "it", "de"],
  "programIds": [101, 205],
  "curatorId": "uuid-curator"
}
```

### 7.2. Student Self-Service: Adding New Country

**Flow:**
1. Student navigates to Profile > Countries.
2. Clicks "Add Country" → Dropdown appears.
3. Selects "Germany 🇩🇪" → Confirmation modal:
   - "Adding Germany will create 5 new tasks. Continue?"
4. Click "Confirm" → Backend creates tasks → UI updates.

---

## 8. Testing Strategy

### 8.1. Unit Tests

**Test Cases:**
- `TaskSyncService.syncStudentTasks()`:
  - ✅ Creates global task only once when student has multiple countries.
  - ✅ Creates country-specific tasks per country.
  - ✅ Restores archived tasks when country is re-added.
  - ✅ Does not duplicate tasks on re-sync.

### 8.2. Integration Tests

**Test Cases:**
- `POST /api/students/:id/countries`:
  - ✅ Adding first country creates baseline tasks.
  - ✅ Adding second country creates only new country-specific tasks (no duplicate globals).
  - ✅ Returns correct `newTasksCount`.

- `DELETE /api/students/:id/countries/:countryId`:
  - ✅ Hard deletes TODO tasks with no submission.
  - ✅ Soft deletes (archives) DONE tasks.
  - ✅ Does NOT delete global tasks.

### 8.3. Gherkin Scenario: Multi-Country Deduplication

```gherkin
Feature: Multi-Country Task Deduplication
  As a student applying to multiple countries
  I want global document tasks to appear only once
  So that I don't see duplicate "Upload Passport" tasks

Scenario: Student adds two countries requiring the same document
  Given a student "Alice" exists with ID "alice-uuid"
  And a global task template exists:
    | Scope  | Document Template | Title            |
    | global | Passport (ID: 1)  | Upload Passport  |
  And Austria has a task template linked to Passport (documentTemplateId: 1)
  And Italy has a task template linked to Passport (documentTemplateId: 1)
  And the student has no countries assigned yet
  
  When the student adds country "Austria" via "POST /students/alice-uuid/countries"
  Then the response should contain "newTasksCount": 1
  And a task should exist with:
    | Field                | Value           |
    | studentId            | alice-uuid      |
    | documentTemplateId   | 1               |
    | title                | Upload Passport |
    | countryId            | null            |
  
  When the student adds country "Italy" via "POST /students/alice-uuid/countries"
  Then the response should contain "newTasksCount": 0
  And the database should still have ONLY 1 task for Passport
  And the task should have:
    | Field                | Value           |
    | documentTemplateId   | 1               |
    | countryId            | null            |
    | archivedAt           | null            |
```

---

## 9. Migration Checklist

### Phase 1: Schema Setup (Week 1)
- [ ] Create `StudentCountry` entity.
- [ ] Add `documentTemplateId`, `scope` to `TaskTemplate`.
- [ ] Add `documentTemplateId`, `sourceTemplateId`, `countryId`, `programId` to `Task`.
- [ ] Run migration to create new tables and columns.
- [ ] Add unique index: `student_countries(student_id, country_id)`.

### Phase 2: Data Migration (Week 2)
- [ ] Write script to migrate `Student.countryId` → `StudentCountry`.
- [ ] Update existing task templates with `scope` and `documentTemplateId`.
- [ ] Verify no data loss.

### Phase 3: Backend Logic (Week 3)
- [ ] Implement `TaskSyncService` with deduplication logic.
- [ ] Add API endpoints: `POST/DELETE /students/:id/countries`.
- [ ] Add unit tests for sync service.
- [ ] Add integration tests for API endpoints.

### Phase 4: Frontend Updates (Week 4)
- [ ] Replace country dropdown with multi-select tag component.
- [ ] Update Curator Wizard to support multi-country.
- [ ] Update Student Profile page to show all countries.
- [ ] Add "Add Country" flow with confirmation modal.

### Phase 5: Validation & Cleanup (Week 5)
- [ ] QA testing on staging environment.
- [ ] Run migration on production (with rollback plan).
- [ ] Monitor task counts and deduplication accuracy.
- [ ] Deprecate `Student.countryId` (mark as nullable, log warnings).

### Phase 6: Removal (Future)
- [ ] Drop `Student.countryId` column after 3 months.

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Duplicate tasks created during migration** | High | Write idempotent migration script; add unique constraints. |
| **Existing students lose tasks** | Critical | Run migration in transaction; verify counts before commit. |
| **Performance degradation on sync** | Medium | Add database indexes on `(studentId, documentTemplateId)` and `(studentId, countryId)`. |
| **UI confusion with too many tags** | Low | Limit display to 5 countries, show "+3 more" for overflow. |

---

## 11. Success Metrics

- **Task Deduplication Rate:** % of students with multiple countries who have only 1 Passport task (target: 100%).
- **Migration Success:** 0 data loss incidents during migration.
- **User Satisfaction:** NPS score from students using multi-country feature (target: 8+).
- **API Performance:** `POST /students/:id/countries` completes in < 500ms.

---

## 12. Future Enhancements

1. **Smart Task Recommendations:** Suggest countries based on student profile.
2. **Country-Specific Deadlines:** Different countries may have different seasonal deadlines.
3. **Document Reuse Across Countries:** When student uploads Passport for Austria, auto-link to Italy's Passport task.
4. **Bulk Country Add:** Allow curator to select "All EU Countries" in one click.

---

## Appendix A: Database Schema Diagram

```
┌─────────────┐         ┌──────────────────┐         ┌──────────┐
│   Student   │────────▶│ StudentCountry   │◀────────│ Country  │
│             │ 1     * │                  │ *     1 │          │
│ id (PK)     │         │ id (PK)          │         │ id (PK)  │
│ countryId   │  ⚠️ deprecated              │         │ name     │
└─────────────┘         │ studentId (FK)   │         │ flagIcon │
                        │ countryId (FK)   │         └──────────┘
                        │ status           │
                        │ enrolledAt       │
                        └──────────────────┘

┌─────────────┐         ┌──────────────────┐         ┌────────────────┐
│ TaskTemplate│         │      Task        │         │DocumentTemplate│
│             │         │                  │         │                │
│ id (PK)     │────────▶│ id (PK)          │◀────────│ id (PK)        │
│ countryId   │ 1     * │ sourceTemplateId │ *     1 │ title          │
│ programId   │         │ documentTemplateId (FK)   │ document_type  │
│ documentTemplateId (FK)│ countryId       │         │ advice_text    │
│ scope       │         │ programId        │         └────────────────┘
│ title       │         │ status           │
└─────────────┘         │ isCustom         │
                        │ archivedAt       │
                        └──────────────────┘
```

---

## Appendix B: References

- **Related Spec:** `docs/specs/feature-program-logic.md` (Smart Sync, Task Templates)
- **Entity Files:**
  - `apps/api/src/entities/student.entity.ts`
  - `apps/api/src/entities/task.entity.ts`
  - `apps/api/src/entities/task-template.entity.ts`
  - `apps/api/src/entities/country.entity.ts`
  - `apps/api/src/entities/document-template.entity.ts`

---

**Document Status:** Ready for Review  
**Next Steps:** Present to development team for implementation planning.
