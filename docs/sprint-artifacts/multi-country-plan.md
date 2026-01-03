# Multi-Country Feature Implementation Plan

## Overview
This plan outlines the steps required to implement multi-country support for students, allowing them to apply to universities in multiple countries simultaneously.

**📊 Implementation Status: 85% Complete**  
✅ Phase 1: Backend Entity Refactoring - **COMPLETE**  
✅ Phase 2: Backend Service Layer - **COMPLETE**  
✅ Phase 3: Backend Document Logic - **COMPLETE**  
✅ Phase 4: Frontend UI Refactoring - **COMPLETE**  
⏳ Phase 5: Testing & Validation - **IN PROGRESS** (Backend tests complete ✅)  
📋 Phase 6: Database Migration & Deployment - **PLAN READY** → See [multi-country-deployment-plan.md](./multi-country-deployment-plan.md)

---

## Implementation Checklist

### Phase 1: Backend - Entity Refactoring

#### 1.1 Student Entity Update (TypeORM Relations)
- [x] Update `Student` entity to add `@ManyToMany` relationship with `Country`
  - [x] Add `@ManyToMany(() => Country)` decorator
  - [x] Add `@JoinTable()` to create the join table `student_countries`
  - [x] Add property: `countries: Country[]`
  - [x] Remove or deprecate single `countryId` field (if exists)
- [x] Update `Country` entity (if needed)
  - [x] Add reverse relationship: `@ManyToMany(() => Student, student => student.countries)`
- [x] Create migration for schema changes
  - [x] Generate migration: `npm run migration:generate -- -n AddStudentCountriesRelation`
  - [x] Review migration SQL for correctness
  - [x] Test migration on development database
  - [x] Add rollback verification

#### 1.2 Update Related DTOs
- [x] Update `CreateStudentDto` to accept `countryIds: string[]` instead of `countryId`
- [x] Update `UpdateStudentDto` to handle `countryIds: string[]`
- [x] Update `StudentResponseDto` to include `countries: Country[]`

---

### Phase 2: Backend - Service Layer

#### 2.1 Refactor TasksService.syncStudentTasks
- [x] Update method signature to handle multiple countries
  - [x] Current: `syncStudentTasks(studentId: string, countryId: string)`
  - [x] New: `syncStudentTasks(studentId: string, countryIds: string[])`
- [x] Implement loop through `student.countries`
  - [x] Fetch all `TaskTemplate` records for all countries in `countryIds`
  - [x] Group templates by country for organized processing
  - [x] For each country, create tasks based on templates
  - [x] Ensure proper error handling for each country iteration
- [x] Update existing task matching logic
  - [x] Match existing tasks by both `studentId` AND `countryId`
  - [x] Prevent duplicate task creation across countries
- [x] Add logging for multi-country sync
  - [x] Log: "Syncing tasks for student {studentId} across {count} countries"
  - [x] Log template counts per country
  - [x] Log creation/update counts per country

#### 2.2 Update AdminService
- [x] Update `createStudent` method
  - [x] Accept `countryIds: string[]` parameter
  - [x] Validate all country IDs exist before creation
  - [x] Set `student.countries` relationship
  - [x] Call `syncStudentTasks` with all country IDs
- [x] Update `updateStudent` method
  - [x] Handle adding/removing countries
  - [x] Re-sync tasks when countries change
  - [x] Consider task cleanup logic when countries are removed

#### 2.3 Update AuthService
- [x] Update `register` method
  - [x] Accept `countryIds: string[]` from registration form
  - [x] Validate country selections
  - [x] Call `syncStudentTasks` with multiple countries

---

### Phase 3: Backend - Document Logic

#### 3.1 Implement existingDocumentIds Check
- [x] Update document requirements endpoint logic
  - [x] Fetch existing documents for the student
  - [x] Build `existingDocumentIds: Set<number>` from database
  - [x] Filter out document types that already exist
- [x] Prevent duplicate Passport requests
  - [x] Check if document type is "Passport" or country-agnostic
  - [x] If exists in `existingDocumentIds`, exclude from requirements
  - [x] Ensure country-specific documents (e.g., Diploma, Certificate) are still requested per country
- [x] Update `GET /api/documents/requirements` endpoint
  - [x] Add logic: filter templates with deduplication
  - [x] Return filtered list of required documents
  - [ ] Add unit tests for deduplication logic

#### 3.2 Document Validation Logic
- [x] N/A - Current schema doesn't have countryId in DocumentTemplate or StudentDocument
- [x] N/A - Documents are student-level, not country-specific in current implementation

---

### Phase 4: Frontend - UI Refactoring

#### 4.1 Update StudentModal Component
- [x] Replace single country dropdown with multi-select
  - [x] Use checkbox group for country selection
  - [x] Display all available countries from API
  - [x] Allow selecting multiple countries
  - [x] Show selected countries as pills/tags
- [x] Update form state
  - [x] Change `countryId: string` to `countryIds: string[]`
  - [x] Update form validation to require at least one country
  - [x] Handle empty selection with error message
- [x] Update submission logic
  - [x] Send `countryIds: string[]` in POST/PATCH request body
  - [x] Handle API errors gracefully
  - [x] Show success message with selected countries

#### 4.2 Update Student Display
- [x] Update student list/table to show multiple countries
  - [x] Display as comma-separated list
  - [x] Handle display gracefully for students with multiple countries
- [x] Update student detail view
  - [x] Show all countries clearly
  - [x] Use comma-separated format for multiple countries

#### 4.3 Update DocumentUploadModal
- [x] Deduplication logic already works in backend
  - [x] Frontend fetches requirements from updated endpoint
  - [x] Backend filters out duplicate documents (e.g., Passport)
  - [x] No changes needed in frontend modal

---

### Phase 5: Testing & Validation

#### 5.1 Backend Tests ✅
- [x] Unit tests for `syncStudentTasks` with multiple countries
  - [x] Test with 1 country (backward compatibility)
  - [x] Test with 2+ countries
  - [x] Test with no countries (edge case)
  - [x] Test template fetching for multiple countries
- [x] Unit tests for document deduplication
  - [x] Test Passport deduplication
  - [x] Test country-specific document handling
- [x] Integration tests for student creation/update
  - [x] Test creating student with multiple countries
  - [x] Test updating student countries
  - [x] Test task sync after country change

**Test Results:** 27/27 tests passing (18 unit + 9 E2E) ✅

#### 5.2 Frontend Tests
- [ ] Test multi-select country picker
  - [ ] Test selecting multiple countries
  - [ ] Test removing countries
  - [ ] Test validation (at least one country required)
- [ ] Test document upload flow
  - [ ] Verify Passport appears only once
  - [ ] Verify country-specific documents appear correctly

#### 5.3 End-to-End Tests
- [ ] Create student with multiple countries via Admin UI
- [ ] Verify tasks are created for all countries
- [ ] Upload documents and verify deduplication
- [ ] Update student countries and verify task re-sync

---

### Phase 6: Database Migration & Deployment

#### 6.1 Data Migration (if needed)
- [ ] Create data migration script for existing students
  - [ ] Migrate single `countryId` to `countries` array
  - [ ] Ensure no data loss
  - [ ] Create backup before migration
- [ ] Test migration on staging environment

#### 6.2 Deployment Checklist
- [ ] Run migrations on staging
- [ ] Verify application functionality on staging
- [ ] Run migrations on production
- [ ] Monitor logs for errors
- [ ] Rollback plan in case of issues

---

## Gherkin Test Scenarios

### Scenario 1: Student applies to multiple countries
```gherkin
Given a new student registers
When they select Austria and Germany as target countries
Then tasks should be created from templates for both AT and DE
And each task should be tagged with the correct countryId
```

### Scenario 2: Passport deduplication
```gherkin
Given a student has selected 3 countries (AT, DE, PL)
When they access the document upload modal
Then they should see only 1 Passport upload field
But 3 separate Diploma upload fields (one per country)
```

### Scenario 3: Adding a country after creation
```gherkin
Given a student exists with country AT
When an admin adds country DE to the student
Then new tasks from DE templates should be created
And existing AT tasks should remain unchanged
```

### Scenario 4: Removing a country
```gherkin
Given a student has countries AT and DE
And has tasks in both TODO and DONE status for both countries
When an admin removes country DE
Then DONE tasks for DE should be kept
And TODO tasks for DE should be soft-deleted or archived
```

---

## Notes & Considerations

### Performance
- Consider pagination when fetching tasks for students with many countries
- Optimize queries to eager-load countries with students
- Add database indexes on join tables

### UX Considerations
- Limit maximum number of countries per student (e.g., 5)
- Provide clear feedback when tasks are synced
- Show loading states during multi-country operations

### Future Enhancements
- Allow students to prioritize countries (primary, secondary, etc.)
- Add country-specific workflows or requirements
- Support country-specific deadlines or timeline adjustments

---

## Definition of Done

### Phase 1-4 (Implementation)
- [x] All checklist items completed (Phases 1-4)
- [x] Backend entities refactored for multi-country support
- [x] Frontend UI updated with multi-select functionality
- [x] Document deduplication logic implemented

### Phase 5 (Testing) - ⏳ IN PROGRESS
- [x] Backend unit tests passing (18/18) ✅
- [x] Integration E2E tests passing (9/9) ✅
- [ ] Frontend tests passing (0/9)
- [ ] Manual testing completed and documented
- **Current Progress:** 54% (27/50 tests)

### Phase 6 (Deployment)
- [ ] Deployment plan executed → See [Deployment Plan](./multi-country-deployment-plan.md)
- [ ] Data migration completed successfully
- [ ] Staging verification passed
- [ ] Production deployment successful
- [ ] Post-deployment monitoring complete (24 hours)

### Final Acceptance
- [ ] Code reviewed and approved
- [ ] Documentation updated (API docs, user guides)
- [ ] Feature verified in production
- [ ] No critical bugs reported
- [ ] Stakeholders sign-off received

