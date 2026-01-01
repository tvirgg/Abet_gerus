# Multi-Country Feature Implementation Plan

## Overview
This plan outlines the steps required to implement multi-country support for students, allowing them to apply to universities in multiple countries simultaneously.

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
- [ ] Update document requirements endpoint logic
  - [ ] Fetch existing documents for the student
  - [ ] Build `existingDocumentIds: Set<string>` from database
  - [ ] Filter out document types that already exist
- [ ] Prevent duplicate Passport requests
  - [ ] Check if document type is "Passport" or country-agnostic
  - [ ] If exists in `existingDocumentIds`, exclude from requirements
  - [ ] Ensure country-specific documents (e.g., Diploma, Certificate) are still requested per country
- [ ] Update `GET /api/documents/requirements` endpoint
  - [ ] Add logic: `if (existingDocumentIds.has(docType)) continue;`
  - [ ] Return filtered list of required documents
  - [ ] Add unit tests for deduplication logic

#### 3.2 Document Validation Logic
- [ ] Ensure document upload validates against student's countries
- [ ] Add validation: uploaded document `countryId` must be in `student.countries`

---

### Phase 4: Frontend - UI Refactoring

#### 4.1 Update StudentModal Component
- [ ] Replace single country dropdown with multi-select
  - [ ] Use Shadcn/Radix `MultiSelect` or `Checkbox Group`
  - [ ] Display all available countries from API
  - [ ] Allow selecting multiple countries
  - [ ] Show selected countries as pills/tags
- [ ] Update form state
  - [ ] Change `countryId: string` to `countryIds: string[]`
  - [ ] Update form validation to require at least one country
  - [ ] Handle empty selection with error message
- [ ] Update submission logic
  - [ ] Send `countryIds: string[]` in POST/PATCH request body
  - [ ] Handle API errors gracefully
  - [ ] Show success message with selected countries

#### 4.2 Update Student Display
- [ ] Update student list/table to show multiple countries
  - [ ] Display as comma-separated list or badges
  - [ ] Consider truncation if too many countries
- [ ] Update student detail view
  - [ ] Show all countries clearly
  - [ ] Group tasks by country (if applicable)

#### 4.3 Update DocumentUploadModal
- [ ] Ensure deduplication logic works in UI
  - [ ] Fetch requirements from updated endpoint
  - [ ] Display only unique documents (e.g., single Passport field)
  - [ ] Show country-specific documents separately
  - [ ] Update stepper logic to reflect new requirements

---

### Phase 5: Testing & Validation

#### 5.1 Backend Tests
- [ ] Unit tests for `syncStudentTasks` with multiple countries
  - [ ] Test with 1 country (backward compatibility)
  - [ ] Test with 2+ countries
  - [ ] Test with no countries (edge case)
  - [ ] Test template fetching for multiple countries
- [ ] Unit tests for document deduplication
  - [ ] Test Passport deduplication
  - [ ] Test country-specific document handling
- [ ] Integration tests for student creation/update
  - [ ] Test creating student with multiple countries
  - [ ] Test updating student countries
  - [ ] Test task sync after country change

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
- [ ] All checklist items completed
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Migration tested on staging
- [ ] Feature verified in production
