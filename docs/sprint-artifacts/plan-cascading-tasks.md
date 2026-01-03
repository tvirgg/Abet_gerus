# Implementation Plan: Cascading Task Templates ("Matryoshka")

## Current Status (Completed: 2026-01-03)
The entire implementation phases (1-3) have been completed. The system now supports hierarchical task templates (Country -> University -> Program), full administration of these templates via the University Settings page, and the student experience for selecting programs and viewing rich task advice.

## Phase 1: Backend Core (NestJS)

### 1.1 Database Schema Updates
- [x] **Task**: Update `TaskTemplate` entity.
- **Details**:
    - Add `programId` (Int, nullable).
    - Add `universityId` (UUID, nullable).
    - Add `advice` (Text/HTML).
    - Add `submissionType` (Enum: 'file', 'text', 'link').
    - Add `validationRules` (JSONB).
    - Add `deadlineOffset` (Int).
- **Files**: `backend/src/tasks/entities/task-template.entity.ts`
- **Action**: Create migration script (`npm run migration:generate`).

### 1.2 Seed Data Expansion
- [x] **Task**: Create hierarchical data examples.
- **Details**:
    - Create 'Country Level' template (e.g., General Visa).
    - Create 'University Level' template (e.g., Vienna registration).
    - Create 'Program Level' template (e.g., Portfolio upload).
- **Files**: `backend/prisma/seed.ts` (or TypeORM seed file).

### 1.3 Service Logic: Cascading Sync
- [x] **Task**: Rewrite `syncStudentTasks` in `TasksService`.
- **Details**:
    - **Step 1**: Fetch student context (`countryId`, `universityIds`, `programIds`).
    - **Step 2**: Query `TaskTemplate` using `OR` condition for all 3 levels.
    - **Step 3**: Implement deduplication logic (accumulate tasks, potentially override by title/stage in future).
    - **Step 4**: Bulk create missing `Task` records for the student.
- **Files**: `backend/src/tasks/tasks.service.ts`

### 1.4 Admin API Endpoints
- [x] **Task**: Update/Create endpoints for hierarchy management.
- **Details**:
    - `GET /admin/hierarchy/:context/:id/tasks`: Support filtering by context.
    - `POST /admin/task-templates`: Ensure DTO supports new fields (`programId`, `universityId`, `advice`, etc.).
- **Files**: `backend/src/admin/admin.controller.ts`, `backend/src/tasks/dto/create-template.dto.ts`

## Phase 2: Curator Tools (Admin Frontend)

### 2.1 University Settings Page ("God Mode")
- [x] **Task**: specific settings page `UniversitySettingsPage`.
- **Details**:
    - Route: `/admin/universities/[id]/settings`.
    - **Components**:
        - `CountryTasksBlock`: Read-only list of inherited tasks.
        - `UniversityTasksBlock`: CRUD list for university-specific tasks.
        - `ProgramsAccordion`: List programs with efficient expand/collapse to manage program tasks.
- **Files**: `frontend/src/pages/admin/UniversitySettingsPage.tsx`

### 2.2 Enhanced Task Editor Modal
- [x] **Task**: Update `TaskTemplateModal`.
- **Details**:
    - Add "Rich Text" editor for `advice`.
    - Add "Submission Config" section (Type selector, validation rules).
    - Handle `universityId` and `programId` hidden fields based on context.
- **Files**: `frontend/src/components/admin/TaskTemplateModal.tsx`

## Phase 3: Student Experience

### 3.1 Student Onboarding/Creation
- [x] **Task**: Update `CreateStudentModal`.
- **Details**:
    - Multi-step wizard or expanded form.
    - **New Step**: Select University and Program(s) *after* Country selection.
    - Validation: Ensure required contexts are selected.
- **Files**: `frontend/src/components/admin/students/CreateStudentModal.tsx`

### 3.2 Task Execution Interface
- [x] **Task**: Update `TaskDetailModal` (Student View).
- **Details**:
    - **Advice Block**: Render HTML advice prominently.
    - **Dynamic Input**:
        - File: Drag & Drop with extension/size validation.
        - Text: Rich Text / Textarea.
        - Link: URL input.
- **Files**: `frontend/src/components/student/TaskDetailModal.tsx`

## Phase 4: Testing & Validation

### 4.1 Backend Tests
- [ ] **Unit**: Test `syncStudentTasks` with various combinations (Country only, Country + Uni, all 3).
- [ ] **Integration**: Verify database constraints and cascading query performance.

### 4.2 Frontend Tests
- [ ] **Component**: Test `UniversitySettingsPage` rendering and hierarchy display.
- [ ] **E2E**:
    - [ ] Create Template (University Level).
    - [ ] Create Student (linked to that University).
    - [ ] Verify Student sees the task.
