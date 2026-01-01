# Developer Implementation Plan: Program Logic & Smart Sync

**Feature:** Program-Task Smart Sync System  
**Date Created:** 2026-01-02  
**Status:** Ready for Development  
**Related Spec:** `docs/specs/feature-program-logic.md`

---

## Overview

This implementation establishes a Smart Sync mechanism that automatically manages a student's task list based on their enrolled programs. The system ensures that:
- Adding a program generates required tasks
- Removing a program cleans up tasks intelligently
- Manual curator edits are preserved during syncs
- Task history is maintained for audit purposes

---

## Phase 1: Backend Core
**Goal:** Establish database schema, migrations, and core sync service logic.  
**Estimated Effort:** 3-5 days

### 1.1 Database Schema & Entities

- [ ] **Create StudentProgram Entity**
  - [ ] Create file: `apps/api/src/entities/student-program.entity.ts`
  - [ ] Define fields: `id`, `studentId`, `programId`, `status`, `enrolledAt`
  - [ ] Add relationships:
    - `@ManyToOne` to `Student`
    - `@ManyToOne` to `Program`
  - [ ] Set default status to `'enrolled'`
  - [ ] Export entity in entity barrel file

- [ ] **Update Student Entity**
  - [ ] File: `apps/api/src/entities/student.entity.ts`
  - [ ] Add `@OneToMany(() => StudentProgram, ...)` relationship
  - [ ] **DECISION POINT:** Migrate from `selectedProgramIds` JSONB:
    - [ ] Create data migration to move existing `selectedProgramIds` to `student_programs` table
    - [ ] Remove `selectedProgramIds` column (or keep temporarily for rollback)

- [ ] **Update Task Entity**
  - [ ] File: `apps/api/src/entities/task.entity.ts`
  - [ ] Add `programId` (nullable, type: number)
  - [ ] Add `sourceTemplateId` (nullable, type: number)
  - [ ] Add `isCustom` (boolean, default: false)
  - [ ] Add `archivedAt` (timestamp, nullable)
  - [ ] Add `@ManyToOne` relationships for optional Program and TaskTemplate references

### 1.2 Database Migrations

- [ ] **Migration: Create StudentProgram Table**
  - [ ] Generate migration: `npm run migration:generate -- StudentProgramTable`
  - [ ] Verify columns: `id`, `studentId`, `programId`, `status`, `enrolledAt`
  - [ ] Add foreign key constraints to `Student` and `Program`
  - [ ] Test migration up/down

- [ ] **Migration: Extend Task Table**
  - [ ] Generate migration: `npm run migration:generate -- TaskSyncFields`
  - [ ] Add columns: `programId`, `sourceTemplateId`, `isCustom`, `archivedAt`
  - [ ] Create indexes on `programId` and `sourceTemplateId` for query performance
  - [ ] Test migration up/down

- [ ] **Data Migration: Seed StudentPrograms**
  - [ ] Create script: `apps/api/src/migrations/seed-student-programs.ts`
  - [ ] Read existing `Student.selectedProgramIds`
  - [ ] Insert rows into `student_programs` with status `'enrolled'`
  - [ ] Verify data integrity after migration

### 1.3 Smart Sync Service

- [ ] **Create SmartSyncService**
  - [ ] Create file: `apps/api/src/services/smart-sync.service.ts`
  - [ ] Inject repositories: `TaskRepository`, `TaskTemplateRepository`, `StudentProgramRepository`
  - [ ] Export service and register in module

- [ ] **Method: `syncTasksForProgram(studentId, programId, action: 'add' | 'remove')`**
  - [ ] **ADD Logic:**
    - [ ] Query `TaskTemplate` where `programId = programId`
    - [ ] For each template:
      - [ ] Check if Task exists (`studentId`, `sourceTemplateId`)
      - [ ] If archived (`archivedAt != null`): restore by setting `archivedAt = null`
      - [ ] If missing: create new Task with `programId`, `sourceTemplateId`, `status = TODO`
      - [ ] **Do NOT overwrite** if `isCustom == true`
  - [ ] **REMOVE Logic:**
    - [ ] Query Tasks where `programId = programId AND studentId = studentId`
    - [ ] For each task:
      - [ ] If `status == TODO AND submission is null`: **Hard Delete**
      - [ ] Else: **Soft Delete** by setting `archivedAt = NOW()`
  - [ ] Return summary: `{ tasksAdded: number, tasksRestored: number, tasksArchived: number, tasksDeleted: number }`

- [ ] **Method: `syncFromTemplateUpdate(templateId: number)`**
  - [ ] Query Tasks where `sourceTemplateId = templateId AND isCustom = false`
  - [ ] Update task fields from template (deadline, title, description, etc.)
  - [ ] Skip tasks with `isCustom == true`

### 1.4 Testing

- [ ] **Unit Tests: SmartSyncService**
  - [ ] Test add program → creates tasks from templates
  - [ ] Test add program → restores archived tasks
  - [ ] Test remove program → hard deletes TODO tasks with no submission
  - [ ] Test remove program → soft deletes tasks with submission or non-TODO status
  - [ ] Test custom tasks are NOT updated during sync
  - [ ] Test template update → propagates to non-custom tasks

- [ ] **Integration Tests: StudentProgram Entity**
  - [ ] Test creating StudentProgram records
  - [ ] Test querying StudentProgram by studentId
  - [ ] Test cascade behavior when student or program is deleted

---

## Phase 2: Curator Tools
**Goal:** Build Admin API endpoints and UI wizards for curators to manage students and programs.  
**Estimated Effort:** 4-6 days

### 2.1 Admin API: Student Creation with Programs

- [ ] **Endpoint: `POST /admin/students`**
  - [ ] File: `apps/api/src/admin/admin.controller.ts`
  - [ ] DTO: `CreateStudentDto` with fields:
    - [ ] `fullName`, `email`, `curatorId`, `companyId`, `programIds[]`, `password?`
  - [ ] Service method: `adminService.createStudentWithPrograms(dto)`
  - [ ] Logic:
    - [ ] Create `Student` entity
    - [ ] Create `User` entity with role `'student'`
    - [ ] For each `programId` in `programIds`:
      - [ ] Insert into `StudentProgram` with status `'enrolled'`
      - [ ] Call `smartSyncService.syncTasksForProgram(studentId, programId, 'add')`
    - [ ] Return: `{ id, status: 'created', tasksGenerated: number }`
  - [ ] Add authentication guard (Manager/Curator only)

- [ ] **Endpoint: `PATCH /admin/students/:id/programs`**
  - [ ] DTO: `UpdateProgramsDto` with `addProgramIds[]` and `removeProgramIds[]`
  - [ ] Service method: `adminService.updateStudentPrograms(studentId, dto)`
  - [ ] Logic:
    - [ ] For each `addProgramIds`: insert StudentProgram, call sync with action `'add'`
    - [ ] For each `removeProgramIds`: delete StudentProgram, call sync with action `'remove'`
  - [ ] Return: `{ added: number, removed: number, tasksSynced: number }`

### 2.2 Admin API: Task Customization

- [ ] **Endpoint: `PATCH /curator/tasks/:id`**
  - [ ] File: `apps/api/src/curator/curator.controller.ts` (or Admin controller)
  - [ ] DTO: `UpdateTaskDto` with fields:
    - [ ] `deadline?`, `title?`, `description?`, `resetToTemplate?`
  - [ ] Service method: `curatorService.customizeTask(taskId, dto)`
  - [ ] Logic:
    - [ ] If `resetToTemplate == true`:
      - [ ] Fetch `Task.sourceTemplateId`
      - [ ] Load `TaskTemplate` by `sourceTemplateId`
      - [ ] Overwrite task fields from template
      - [ ] Set `isCustom = false`
    - [ ] Else:
      - [ ] Update specified fields
      - [ ] Set `isCustom = true`
  - [ ] Return updated task

- [ ] **Validation:**
  - [ ] Ensure curator has access to the student via `curatorId` relationship
  - [ ] Add authorization guard

### 2.3 Student Modal Wizard (Frontend - Admin UI)

- [ ] **Component: `StudentWizardModal`**
  - [ ] File: `apps/admin/src/components/students/StudentWizardModal.tsx`
  - [ ] Step 1: **Student Details**
    - [ ] Fields: Full Name, Email, Curator (dropdown), Company (dropdown)
    - [ ] Optional: Generate temporary password
  - [ ] Step 2: **Program Selection**
    - [ ] Multi-select dropdown or searchable list
    - [ ] Display program name, university, major
    - [ ] Show count of selected programs
  - [ ] Step 3: **Preview**
    - [ ] Display: "Adding [N] programs will generate approximately [X] tasks"
    - [ ] List programs and estimated task count per program
  - [ ] Step 4: **Confirm**
    - [ ] Call `POST /admin/students` with payload
    - [ ] Show success message with task count

- [ ] **Component: `TaskEditModal`**
  - [ ] File: `apps/admin/src/components/tasks/TaskEditModal.tsx`
  - [ ] Form fields: Title, Description, Deadline (date picker)
  - [ ] Button: "Reset to Template" (shows warning dialog)
  - [ ] Call: `PATCH /curator/tasks/:id`
  - [ ] Visual indicator if task is custom (`isCustom == true`)

### 2.4 Testing

- [ ] **API Tests:**
  - [ ] Test `POST /admin/students` creates student, programs, and tasks
  - [ ] Test `PATCH /admin/students/:id/programs` adds/removes programs correctly
  - [ ] Test `PATCH /curator/tasks/:id` sets isCustom flag
  - [ ] Test reset to template functionality

- [ ] **E2E Tests (Admin UI):**
  - [ ] Test student wizard flow end-to-end
  - [ ] Test task edit modal saves changes
  - [ ] Test reset to template updates task

---

## Phase 3: Student Experience
**Goal:** Enable students to browse programs, enroll themselves, and view tasks dynamically.  
**Estimated Effort:** 5-7 days

### 3.1 Student API: Program Catalog & Enrollment

- [ ] **Endpoint: `GET /programs`**
  - [ ] File: `apps/api/src/programs/programs.controller.ts`
  - [ ] Query params: `search?`, `major?`, `country?`, `university?`
  - [ ] Return paginated list of available programs
  - [ ] Include: `id`, `name`, `university`, `major`, `country`, `deadline`
  - [ ] Public or authenticated access

- [ ] **Endpoint: `GET /students/me/programs`**
  - [ ] Return list of enrolled programs for current student
  - [ ] Join `StudentProgram` where `studentId = currentUserId`
  - [ ] Include status (enrolled, completed, dropped)

- [ ] **Endpoint: `POST /students/programs`**
  - [ ] DTO: `{ programId: number }`
  - [ ] Service method: `studentService.enrollInProgram(userId, programId)`
  - [ ] Logic:
    - [ ] Validate program exists
    - [ ] Check if already enrolled (prevent duplicates)
    - [ ] Insert into `StudentProgram` with status `'enrolled'`
    - [ ] Call `smartSyncService.syncTasksForProgram(studentId, programId, 'add')`
  - [ ] Return: `{ status: 'enrolled', program: {...}, newTasksCount: number }`

- [ ] **Endpoint: `DELETE /students/programs/:programId`**
  - [ ] Service method: `studentService.unenrollFromProgram(userId, programId)`
  - [ ] Logic:
    - [ ] Delete StudentProgram record
    - [ ] Call `smartSyncService.syncTasksForProgram(studentId, programId, 'remove')`
  - [ ] Return: `{ status: 'unenrolled', tasksArchived: number }`

### 3.2 Student UI: My Programs Page

- [ ] **Component: `MyProgramsPage`**
  - [ ] File: `apps/student/src/pages/MyPrograms.tsx`
  - [ ] Fetch: `GET /students/me/programs`
  - [ ] Display:
    - [ ] List of enrolled programs (card layout)
    - [ ] Program name, university, major, status badge
    - [ ] "View Tasks" button → navigate to filtered task list
    - [ ] "Unenroll" button (with confirmation dialog)

- [ ] **Component: `ProgramCard`**
  - [ ] File: `apps/student/src/components/programs/ProgramCard.tsx`
  - [ ] Props: `program`, `onUnenroll`
  - [ ] Display program details
  - [ ] Badge for status (enrolled/completed/dropped)

### 3.3 Student UI: Program Catalog & Enrollment

- [ ] **Component: `ProgramCatalogPage`**
  - [ ] File: `apps/student/src/pages/ProgramCatalog.tsx`
  - [ ] Fetch: `GET /programs`
  - [ ] Search bar with filters: Major, Country, University
  - [ ] Display: Grid or list of program cards
  - [ ] "Add to My List" button on each card

- [ ] **Component: `ProgramCatalogCard`**
  - [ ] File: `apps/student/src/components/programs/ProgramCatalogCard.tsx`
  - [ ] Props: `program`, `isEnrolled`, `onEnroll`
  - [ ] Visual indicator if already enrolled
  - [ ] Call: `POST /students/programs` on button click
  - [ ] Show toast: "Program added! [X] new tasks created."

- [ ] **Enrollment Modal/Confirmation**
  - [ ] Component: `EnrollConfirmDialog`
  - [ ] Show preview: "Adding this program will generate [X] tasks"
  - [ ] "Confirm" → calls API
  - [ ] "Cancel" → close dialog

### 3.4 Student UI: Task List Integration

- [ ] **Update: `TaskListPage`**
  - [ ] File: `apps/student/src/pages/TaskList.tsx`
  - [ ] Add filter option: "By Program"
  - [ ] Dropdown to filter tasks by `programId`
  - [ ] Display program badge/chip on task cards showing which program the task belongs to
  - [ ] Hide archived tasks by default (add toggle "Show Archived")

### 3.5 Testing

- [ ] **API Tests:**
  - [ ] Test `GET /programs` returns catalog
  - [ ] Test `POST /students/programs` enrolls and syncs tasks
  - [ ] Test `DELETE /students/programs/:id` unenrolls and archives tasks
  - [ ] Test duplicate enrollment is prevented

- [ ] **E2E Tests (Student UI):**
  - [ ] Test browsing program catalog
  - [ ] Test enrolling in a program end-to-end
  - [ ] Test viewing "My Programs"
  - [ ] Test unenrolling from a program
  - [ ] Test task list updates after enrollment/unenrollment

---

## Dependencies & Prerequisites

- **Database:** PostgreSQL with TypeORM migrations enabled
- **Entities:** `Student`, `Program`, `Task`, `TaskTemplate` must already exist
- **Auth:** JWT authentication middleware must be configured
- **Roles:** `student`, `curator`, `manager` roles must be defined in User entity

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data migration from JSONB to StudentProgram fails | High | Test migration on staging DB first; keep backup of `selectedProgramIds` column temporarily |
| Performance degradation on large task sync operations | Medium | Add batch processing with pagination; optimize queries with proper indexes |
| Curator accidentally resets custom tasks | Medium | Add confirmation dialog in UI; implement audit log for task changes |
| Race conditions during concurrent enrollments | Medium | Use database transactions; add unique constraint on (studentId, programId) |

---

## Definition of Done

### Phase 1
- [ ] All migrations run successfully on local and staging
- [ ] SmartSyncService unit tests pass with >90% coverage
- [ ] Manual testing confirms task creation/archival logic works as expected

### Phase 2
- [ ] Admin API endpoints return correct responses (verified via Postman/Swagger)
- [ ] Student Wizard creates student + programs + tasks in one flow
- [ ] Task Edit Modal correctly sets `isCustom` flag

### Phase 3
- [ ] Students can browse, enroll, and unenroll from programs via UI
- [ ] Task list dynamically updates after program changes
- [ ] E2E tests cover critical student workflows

---

## Rollout Strategy

1. **Phase 1 Deployment:**
   - Run migrations on staging
   - Deploy SmartSyncService
   - Validate with manual API calls

2. **Phase 2 Deployment:**
   - Deploy Admin API endpoints
   - Release Student Wizard to curators for beta testing
   - Collect feedback, iterate

3. **Phase 3 Deployment:**
   - Deploy Student UI features
   - Enable program catalog for limited user group
   - Monitor task generation performance
   - Full release after validation

---

## Notes for Developers

- **Code Reviews:** All PRs must be reviewed by at least one senior developer
- **Testing:** Run all tests before pushing: `npm run test && npm run test:e2e`
- **Documentation:** Update API docs (Swagger) after adding/modifying endpoints
- **Performance:** Monitor database query performance; use `EXPLAIN ANALYZE` for complex queries
- **Rollback Plan:** Keep `selectedProgramIds` column until Phase 3 is fully validated

---

**Questions or Blockers?** Reach out to the PM or Tech Lead immediately.
