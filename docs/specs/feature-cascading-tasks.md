# Feature Specification: Cascading Task Templates ("Matryoshka")

## 1. Overview
The "Matryoshka" architecture introduces a hierarchical task generation system that allows for granular control over student tasks based on their context. Tasks can be defined at three levels:
1.  **Country Level**: Generic tasks capable for all students in a country (e.g., "General Visa Application").
2.  **University Level**: Tasks specific to a target university (e.g., "Vienna University Registration").
3.  **Program Level**: Tasks specific to a study program (e.g., "Portfolio for Architecture").

This system replaces the flat "Country-only" logic with a cascading inheritance model.

## 2. Architecture & Data Model

### Entity: `TaskTemplate`
Existing entity requires enhancement to support hierarchy and "Deep Configuration".

**New Fields:**
*   `programId` (nullable, Int): Link to specific program.
*   `universityId` (nullable, UUID): Link to specific university.
*   `advice` (Text/HTML): Contextual advice for the student (e.g., "Go to office 404").
*   `submissionType` (Enum/String): `file` | `text` | `link`.
*   `validationRules` (JSONB): Auto-validation rules (e.g., `{ "allowedExtensions": ["pdf"], "maxSizeMb": 5 }`).
*   `deadlineOffset` (Int): Days relative to program start or general deadline.

**Hierarchy Logic:**
*   Template `A` (Country=Austria)
*   Template `B` (Uni=Vienna)
*   Template `C` (Program=CS)
*   Student with (Austria, Vienna, CS) gets `A + B + C`.

## 3. Backend Implementation (NestJS)

### 3.1. Database Updates
*   Run migration to add new columns to `task_templates` table.
*   Update `seed.ts` to generate examples of hierarchical data for testing.

### 3.2. Service Logic: `TasksService.syncStudentTasks`
The synchronization logic must be rewritten to cascadingly fetch templates.

**Algorithm:**
1.  **Fetch Context**: Get Student's `countryId`, `universityIds` (list), and `programIds` (list).
2.  **Query Templates**:
    ```typescript
    const templates = await repo.find({
       where: [
          { countryId: student.countryId },                 // Level 1: Country
          { universityId: In(student.universityIds) },      // Level 2: University
          { programId: In(student.programIds) }             // Level 3: Program
       ]
    });
    ```
3.  **Deduplication**: Use a composite key (`stage` + `title`) to ensure a University task can override a Country task if needed (or just accumulate).
    *   *Decision*: For now, we **accumulate** (layering). If "Override" is needed later, we can add a `key` field.
4.  **Creation**: Bulk create non-existent tasks in `Task` table.

### 3.3. API Endpoints (Admin)
*   `GET /admin/hierarchy/:context/:id/tasks`: Fetch tasks for a specific context (Uni X, Program Y) including inherited ones.
*   `POST /admin/task-templates`: Create/Update capable of handling `universityId` and `programId`.

## 4. Frontend Implementation (Admin)

### 4.1. University Settings Page (`/admin/universities/[id]/settings`)
A new "God Mode" interface for configuring the hierarchy.
*   **Country Tasks Block**: Read-only list of tasks inherited from the Country.
*   **University Tasks Block**: CRUD list for tasks specific to this University.
*   **Programs Accordion**: List of programs, expandable to show/edit Program-specific tasks.

### 4.2. Task Editor Modal ("Super Editor")
Enhanced modal for creating/editing templates:
*   **Content**: Title, Description, **Rich Text Advice**.
*   **Settings**: Stage, XP Reward.
*   **Submission Config**:
    *   Type Selector: File / Text / Link.
    *   If File: Checkboxes for PDF, JPG, PNG.
*   **Targeting**: Hidden fields for `universityId`/`programId` based on where the modal was opened.

### 4.3. Student Creation Wizard
Update `StudentModal` to enforce structure:
1.  **Step 1**: Basic Info (Name, Email).
2.  **Step 2**: Country Selection.
3.  **Step 3 (New)**: multi-select for Universities and Programs.
    *   *Validation*: Cannot create student without at least one Context if the Country requires it.

## 5. Frontend Implementation (Student)

### 5.1. Task Details Modal
*   **Advice Section**: Display `advice` content in a prominent "Curator Tip" box (e.g., yellow background, bulb icon).
*   **Dynamic Input**:
    *   `submissionType === 'file'`: Drag & Drop Zone (with client-side validation of extension).
    *   `submissionType === 'text'`: Rich Text Editor or Textarea.
    *   `submissionType === 'link'`: URL Input with pattern validation.

## 6. Implementation Checklist

### Phase 1: Backend Core
- [ ] Add `advice`, `submissionType`, `validationRules`, `deadlineOffset` to `TaskTemplate` entity.
- [ ] Create DB Migration.
- [ ] Update `seed.ts` with hierarchical examples.
- [ ] Refactor `syncStudentTasks` in `TasksService`.

### Phase 2: Curator Tools (Admin UI)
- [ ] Create `UniversitySettingsPage`.
- [ ] Build "Task Hierarchy View" (showing inherited vs specific tasks).
- [ ] Update `TaskTemplateModal` with new fields (Advice, Submission Rules).

### Phase 3: Student Experience & Onboarding
- [ ] Update `CreateStudentModal` to require University/Program selection.
- [ ] Update `TaskDetailModal` (Student view) to render Advice and Dynamic Inputs.
