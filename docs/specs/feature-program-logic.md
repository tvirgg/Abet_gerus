# Feature Specification: Program Logic & Smart Sync

**Status:** Draft
**Date:** 2026-01-02
**Author:** AI Architect

## 1. Context & Problem Statement

The system connects **Students** to **Programs** (Universities). Each Program implies a specific set of **Tasks** (Deadlines, Essays, Exams) and **Documents** (Passport, Transcripts).

Currently:
- `Student` has `selectedProgramIds` (JSONB array).
- `Task`s are instances of work assigned to a student.
- `TaskTemplate`s define the blueprint for these tasks.

**The Challenge:**
We need a "Smart Sync" mechanism that keeps the Student's Task List in sync with their `selectedProgramIds` (selected programs).
- If a program is added -> Generate tasks.
- If a program is removed -> Clean up tasks wisely.
- If a curator manually edits a task -> Don't overwrite it during sync.

---

## 2. Schema Changes & Data Model

### 2.1. Student-Program Relationship (Recommendation)
**Current:** `selectedProgramIds` (JSONB array) in `Student` entity.
**Problem:** Referential integrity is weak. Difficult to query "all students in Program X".
**Proposal:** Introduce a specific Join Table `StudentPrograms`.

```typescript
// apps/api/src/entities/student-program.entity.ts

@Entity('student_programs')
export class StudentProgram {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  studentId!: string;

  @ManyToOne(() => Student, (s) => s.programs)
  student!: Student;

  @Column()
  programId!: number;

  @ManyToOne(() => Program)
  program!: Program;

  @Column({ default: 'enrolled' }) // e.g., 'enrolled', 'completed', 'dropped'
  status!: string;

  @CreateDateColumn()
  enrolledAt!: Date;
}
```

*Note: Update `Student` entity to have `@OneToMany(() => StudentProgram, ...)` replacing the jsonb column.*

### 2.2. Task Entity Updates
We need to track the lineage of a task and its state, specifically regarding custom overrides and archival.

```typescript
// apps/api/src/entities/task.entity.ts

@Entity('tasks')
export class Task {
  // ... existing fields ...

  // Link to the specific Program that caused this task
  // Nullable because some tasks are General (e.g. "Fill Profile") or Country-level
  @Column({ nullable: true })
  programId?: number;

  // Link to the Source Template
  @Column({ nullable: true })
  sourceTemplateId?: number; 

  // Customization Flag
  // true = Manually edited by Curator. Sync logic ignores these fields during updates.
  @Column({ default: false })
  isCustom!: boolean;

  // Archival Status 
  // Null = Active, Date = When it was archived/soft-deleted.
  @Column({ type: 'timestamp', nullable: true })
  archivedAt?: Date;
}
```

---

## 3. API Contracts

### 3.1. Curator Wizard (Create Student)
**Endpoint:** `POST /admin/students`
**Description:** Creates a student, optionally assigns a curator, and bulk-enrolls them in programs. Triggers Smart Sync immediately for the initial task generation.

**Request Payload:**
```json
{
  "fullName": "Alice Wonder",
  "email": "alice@example.com",
  "curatorId": "uuid-of-curator",
  "companyId": "uuid-company",
  "programIds": [101, 102, 205],
  "password": "optional-temp-password"
}
```

**Response:**
```json
{
  "id": "student-uuid",
  "status": "created",
  "tasksGenerated": 15
}
```

### 3.2. Program Self-Enrollment
**Endpoint:** `POST /students/programs`
**Description:** Student adds a program to their list (self-service).

**Request Payload:**
```json
{
  "programId": 105
}
```

**Response:**
```json
{
  "status": "enrolled",
  "program": { "id": 105, "name": "CS at MIT" },
  "newTasksCount": 5
}
```

### 3.3. Curator Task Customization
**Endpoint:** `PATCH /curator/tasks/:id`
**Description:** Updates task details. Automatically sets `isCustom: true` unless explicitly handling a reset.

**Request Payload (Edit):**
```json
{
  "deadline": "2026-02-15T00:00:00Z",
  "title": "Modified Essay Title",
  "description": "Custom instructions..."
}
```
*Effect: Backend updates fields and sets `isCustom = true`.*

**Request Payload (Reset):**
```json
{
  "resetToTemplate": true
}
```
*Effect: Backend looks up `sourceTemplateId`, reverts fields, and sets `isCustom = false`.*

---

## 4. Smart Sync Logic

The `SmartSyncService` monitors the `StudentPrograms` table and handles the lifecycle of tasks.

### 4.1. When a Program is ADDED
**Trigger:** `POST /students/programs` or Admin assignment.
**Logic:**
1.  Query `TaskTemplate`s for the given `programId`.
2.  For each template:
    -   Check if a `Task` exists for this student AND `sourceTemplateId`.
    -   If **Exists**:
        -   If `archivedAt` is not null, restore it (`archivedAt = null`).
        -   Do not overwrite fields if `isCustom` is true.
    -   If **Missing**:
        -   Create new `Task`.
        -   Set `programId = incomingProgramId`.
        -   Set `sourceTemplateId = template.id`.
        -   Set `status = TODO`.

### 4.2. When a Program is REMOVED
**Trigger:** `DELETE /students/programs/:id` (or similar).
**Logic:**
1.  Find all tasks where `programId == removedProgramId`.
2.  Iterate through tasks:
    -   If `status == TODO` AND `submission` is empty:
        -   **Hard Delete**. (Clean up noise).
    -   If `status != TODO` OR `submission` has data:
        -   **Soft Delete**: Set `archivedAt = NOW()`. (Preserve history).

### 4.3. Template Updates
**Trigger:** Admin updates a `TaskTemplate`.
**Logic:**
1.  Find all child tasks (`where sourceTemplateId = template.id`).
2.  Filter out tasks where `isCustom == true`.
3.  Update the remaining tasks with new template values.

---

## 5. UI/UX Flow

### 5.1. Curator Wizard
1.  **Select Student:** Pick from list or create new.
2.  **Program Browser:** Search Universites/Majors. Add to selection.
3.  **Preview:** Show proposed task changes ("+5 New Tasks, -2 Archives").
4.  **Confirm:** Calls `POST /admin/students` (creation) or update endpoint.

### 5.2. Student "Enroll" Flow
1.  **Explore:** "Add to My List" on a Program page.
2.  **Action:** Calls `POST /students/programs`.
3.  **Feedback:** Toast "Program Added", roadmap updates.

---

## 6. Test Scenarios

### Scenario A: Adding a Program Generates Specific Tasks

```gherkin
Feature: Program Enrollment Task Generation
  As a student
  I want my task list to automatically populate when I enroll in a program
  So that I know exactly what tasks I need to complete

Scenario: Student enrolls in a new program with 5 task templates
  Given a student "Alice Wonder" exists with student ID "alice-uuid"
  And a program "CS at MIT" exists with program ID 101
  And program 101 has the following task templates:
    | Template ID | Title                  | Type     | Deadline Offset |
    | 1001        | Submit SAT Scores      | document | +30 days        |
    | 1002        | Essay: Why MIT?        | essay    | +45 days        |
    | 1003        | Interview Scheduling   | meeting  | +60 days        |
    | 1004        | Recommendation Letters | document | +40 days        |
    | 1005        | Financial Aid Form     | document | +50 days        |
  And the student has no existing tasks
  When the student enrolls in program 101 via "POST /students/programs"
  Then the response status should be 200
  And the response should contain:
    """json
    {
      "status": "enrolled",
      "program": { "id": 101, "name": "CS at MIT" },
      "newTasksCount": 5
    }
    """
  And the student should have 5 tasks in the database
  And each task should have:
    | Field             | Value         |
    | programId         | 101           |
    | sourceTemplateId  | (matching)    |
    | status            | TODO          |
    | isCustom          | false         |
    | archivedAt        | null          |
  And task titles should match template titles
```

### Scenario B: Removing a Program Handles TODO vs DONE Tasks Differently

```gherkin
Feature: Program Removal Task Cleanup
  As a curator
  I want the system to intelligently handle task cleanup when a student removes a program
  So that incomplete tasks are deleted and completed work is preserved

Scenario: Student removes program with mixed task statuses
  Given a student "Bob Smith" exists with student ID "bob-uuid"
  And the student is enrolled in program "Law at Harvard" with program ID 202
  And the student has the following tasks for program 202:
    | Task ID | Title                    | Status | Submission | sourceTemplateId |
    | 5001    | Submit LSAT Scores       | TODO   | null       | 2001             |
    | 5002    | Personal Statement       | TODO   | null       | 2002             |
    | 5003    | Transcript Upload        | DONE   | "file.pdf" | 2003             |
    | 5004    | Interview Confirmation   | DONE   | "confirmed"| 2004             |
    | 5005    | Background Check         | IN_PROGRESS | null  | 2005             |
  When the curator removes program 202 via "DELETE /students/programs/202"
  Then the response status should be 200
  And the following tasks should be HARD DELETED from the database:
    | Task ID | Title                    | Reason                          |
    | 5001    | Submit LSAT Scores       | status=TODO, no submission      |
    | 5002    | Personal Statement       | status=TODO, no submission      |
  And the following tasks should be SOFT DELETED (archivedAt set):
    | Task ID | Title                    | Reason                          |
    | 5003    | Transcript Upload        | status=DONE, has submission     |
    | 5004    | Interview Confirmation   | status=DONE, has submission     |
    | 5005    | Background Check         | status=IN_PROGRESS (not TODO)   |
  And task 5003 should have archivedAt IS NOT NULL
  And task 5004 should have archivedAt IS NOT NULL
  And task 5005 should have archivedAt IS NOT NULL
  And tasks 5001 and 5002 should NOT exist in the database
```

### Scenario C: Curator Custom Deadline is NOT Reverted During Sync

```gherkin
Feature: Custom Task Preservation During Sync
  As a curator
  I want my manual task customizations to be preserved during template updates
  So that student-specific adjustments are not lost

Scenario: Template deadline changes but custom task deadline remains unchanged
  Given a student "Carol Davis" exists with student ID "carol-uuid"
  And the student is enrolled in program "Engineering at Stanford" with program ID 303
  And a task template exists with the following details:
    | Template ID | Title                  | Deadline Offset |
    | 3001        | Capstone Proposal      | +60 days        |
  And the student has a task based on this template:
    | Field             | Value                |
    | taskId            | 6001                 |
    | programId         | 303                  |
    | sourceTemplateId  | 3001                 |
    | title             | Capstone Proposal    |
    | deadline          | 2026-03-01T00:00:00Z |
    | isCustom          | false                |
  When the curator manually updates task 6001 via "PATCH /curator/tasks/6001":
    """json
    {
      "deadline": "2026-04-15T00:00:00Z"
    }
    """
  Then the response status should be 200
  And task 6001 should have:
    | Field    | Value                |
    | deadline | 2026-04-15T00:00:00Z |
    | isCustom | true                 |
  When the template 3001 is updated by admin to have deadline offset "+90 days"
  And the Smart Sync process runs for all students with program 303
  Then task 6001 should STILL have:
    | Field    | Value                |
    | deadline | 2026-04-15T00:00:00Z |
    | isCustom | true                 |
  And other non-custom tasks based on template 3001 should have updated deadlines
  But task 6001 deadline should remain "2026-04-15T00:00:00Z" (unchanged)

Scenario: Curator resets custom task to template defaults
  Given task 6001 exists with isCustom=true and deadline="2026-04-15T00:00:00Z"
  And the source template 3001 has deadline offset "+90 days" from enrollment
  And the student enrolled on "2026-01-01T00:00:00Z"
  When the curator sends "PATCH /curator/tasks/6001":
    """json
    {
      "resetToTemplate": true
    }
    """
  Then the response status should be 200
  And task 6001 should have:
    | Field    | Value                |
    | deadline | 2026-04-01T00:00:00Z |
    | isCustom | false                |
    | title    | Capstone Proposal    |
  And task 6001 should now receive future template updates during sync
```

