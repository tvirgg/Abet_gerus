# Multi-Country Testing Plan

## Overview
This document outlines the testing strategy for the Multi-Country feature implementation.

**Status:** Ready for execution  
**Dependencies:** Phase 1-4 complete ✅  
**Estimated Effort:** 8-12 hours

---

## Phase 5.1: Backend Unit Tests

### Test Suite: TasksService.syncStudentTasks

**File:** `backend/src/tasks/tasks.service.spec.ts`

#### Test Cases:

```gherkin
Scenario: Sync tasks for student with single country (backward compatibility)
  Given a student with countryIds: ['at']
  And 5 task templates exist for country 'at'
  When syncStudentTasks is called
  Then 5 tasks should be created
  And each task should have countryId = 'at'

Scenario: Sync tasks for student with multiple countries
  Given a student with countryIds: ['at', 'de', 'pl']
  And 5 task templates exist for country 'at'
  And 6 task templates exist for country 'de'
  And 4 task templates exist for country 'pl'
  When syncStudentTasks is called
  Then 15 tasks should be created in total
  And tasks should be correctly tagged with their respective countryId

Scenario: Sync tasks with no countries (edge case)
  Given a student with countryIds: []
  When syncStudentTasks is called
  Then 0 tasks should be created
  And no errors should be thrown

Scenario: Prevent duplicate task creation
  Given a student with countryIds: ['at', 'de']
  And tasks already exist for some templates
  When syncStudentTasks is called
  Then only missing tasks should be created
  And existing tasks should not be duplicated
```

**Implementation Checklist:**
- [ ] Set up test fixtures (mock countries, templates, students)
- [ ] Mock `TaskTemplateRepository` and `TaskRepository`
- [ ] Test single country sync
- [ ] Test multi-country sync (2+ countries)
- [ ] Test empty country array
- [ ] Test duplicate prevention logic
- [ ] Verify logging output
- [ ] Test error handling (e.g., invalid country ID)

---

### Test Suite: DocumentsService - Deduplication Logic

**File:** `backend/src/documents/documents.service.spec.ts`

#### Test Cases:

```gherkin
Scenario: Passport deduplication for multi-country student
  Given a student with countries ['at', 'de', 'pl']
  And the student has NO uploaded documents
  When getRequirements is called
  Then Passport should appear exactly ONCE in the list
  And country-specific documents should appear for each country

Scenario: Passport already uploaded
  Given a student with countries ['at', 'de']
  And the student has already uploaded a Passport
  When getRequirements is called
  Then Passport should NOT appear in the requirements list
  And other country-specific documents should still appear

Scenario: Country-specific document handling
  Given a student with countries ['at', 'de']
  And the student has uploaded Diploma for 'at' only
  When getRequirements is called
  Then Diploma should still appear for country 'de'
  But Diploma should NOT appear for country 'at'
```

**Implementation Checklist:**
- [ ] Create test fixtures for DocumentTemplate records
- [ ] Mock StudentDocumentRepository
- [ ] Test passport deduplication (not uploaded yet)
- [ ] Test passport already uploaded
- [ ] Test country-specific document logic
- [ ] Verify correct filtering logic

---

## Phase 5.2: Integration Tests

### Test Suite: Student Management Integration

**File:** `backend/test/student-management.e2e-spec.ts`

#### Test Cases:

```gherkin
Scenario: Create student with multiple countries via API
  Given valid student data with countryIds: ['at', 'de']
  When POST /api/admin/students is called
  Then student should be created successfully
  And student.countries should contain both AT and DE
  And tasks should be synced for both countries

Scenario: Update student - add new country
  Given an existing student with country ['at']
  When PATCH /api/admin/students/:id with countryIds: ['at', 'de']
  Then student.countries should be updated
  And new tasks for 'de' should be created
  And existing tasks for 'at' should remain unchanged

Scenario: Update student - remove country
  Given an existing student with countries ['at', 'de']
  And the student has tasks for both countries (some TODO, some DONE)
  When PATCH /api/admin/students/:id with countryIds: ['at']
  Then student.countries should only contain 'at'
  And DONE tasks for 'de' should be preserved
  And TODO tasks for 'de' should be soft-deleted/archived

Scenario: Invalid country ID provided
  Given student data with invalid countryIds: ['invalid-id']
  When POST /api/admin/students is called
  Then response should be 400 Bad Request
  And error message should indicate invalid country ID
```

**Implementation Checklist:**
- [ ] Set up test database with Country seeds
- [ ] Test student creation with 1 country
- [ ] Test student creation with multiple countries
- [ ] Test adding countries to existing student
- [ ] Test removing countries from existing student
- [ ] Test validation errors for invalid country IDs
- [ ] Verify task sync behavior after updates
- [ ] Test task cleanup when removing countries

---

## Phase 5.3: Frontend Tests

### Test Suite: StudentModal - Multi-Select Component

**File:** `frontend/src/components/students/StudentModal.test.tsx`

#### Test Cases:

```gherkin
Scenario: Select multiple countries
  Given the StudentModal is open
  When user selects Austria, Germany, and Poland
  Then all 3 countries should be highlighted/checked
  And country pills/tags should appear below the selector

Scenario: Remove selected country
  Given 3 countries are selected
  When user clicks the X on the Germany pill
  Then Germany should be deselected
  And only Austria and Poland should remain selected

Scenario: Validation - at least one country required
  Given the StudentModal is open with no countries selected
  When user tries to submit the form
  Then form should not submit
  And error message "Please select at least one country" should appear

Scenario: Form submission with multiple countries
  Given the StudentModal has 2 countries selected
  When user submits the form
  Then POST/PATCH request should be sent
  And countryIds array should contain both country IDs
```

**Implementation Checklist:**
- [ ] Set up React Testing Library environment
- [ ] Mock country API endpoint
- [ ] Test rendering of multi-select component
- [ ] Test selecting multiple countries
- [ ] Test deselecting countries
- [ ] Test form validation
- [ ] Test form submission payload
- [ ] Test error handling

---

### Test Suite: Document Upload - Deduplication Flow

**File:** `frontend/src/components/documents/DocumentUploadModal.test.tsx`

#### Test Cases:

```gherkin
Scenario: Passport appears only once for multi-country student
  Given a student with 3 countries
  When DocumentUploadModal is opened
  Then the requirements list should show Passport only once
  And country-specific documents should appear for each country

Scenario: Already uploaded documents are excluded
  Given a student has uploaded Passport
  When DocumentUploadModal is opened
  Then Passport should NOT appear in the requirements list
```

**Implementation Checklist:**
- [ ] Mock `/api/documents/requirements` endpoint
- [ ] Test requirements rendering with deduplication
- [ ] Verify Passport appears only once
- [ ] Test already uploaded documents are excluded

---

## Phase 5.4: End-to-End Tests

### E2E Test Suite

**File:** `e2e/multi-country-flow.spec.ts`

#### Test Cases:

```gherkin
Scenario: Full multi-country student lifecycle
  Given admin is logged in
  When admin creates a new student with countries AT, DE
  Then student should appear in student list
  And student should show "Austria, Germany" in countries column
  
  When admin opens the student's task list
  Then tasks from AT templates should be visible
  And tasks from DE templates should be visible
  
  When student logs in and opens document upload
  Then Passport should appear only once
  And country-specific documents should appear for both countries
  
  When student uploads Passport
  And student reopens the upload modal
  Then Passport should no longer appear in requirements
```

**Implementation Checklist:**
- [ ] Set up Playwright/Cypress test environment
- [ ] Test admin student creation flow
- [ ] Test student task visualization
- [ ] Test document upload flow
- [ ] Test document deduplication in UI
- [ ] Test student update flow (adding/removing countries)

---

## Phase 5.5: Test Execution Checklist

### Pre-Test Setup
- [ ] Ensure test database is seeded with:
  - [ ] Countries: AT, DE, PL
  - [ ] TaskTemplates for each country
  - [ ] DocumentTemplates with appropriate types
- [ ] Set up test environment variables
- [ ] Clear test database before each test suite

### Execution Order
1. [ ] Run unit tests: `npm run test`
2. [ ] Run integration tests: `npm run test:e2e`
3. [ ] Run frontend tests: `npm run test:frontend`
4. [ ] Run E2E tests: `npm run test:e2e:ui`

### Success Criteria
- [ ] All unit tests pass (100% coverage on critical paths)
- [ ] All integration tests pass
- [ ] All frontend tests pass
- [ ] All E2E tests pass
- [ ] No console errors in test runs
- [ ] Test coverage > 80% for modified files

---

## Phase 5.6: Manual Testing Checklist

### Admin UI Testing
- [ ] Create student with 1 country → verify tasks created
- [ ] Create student with 3 countries → verify tasks created for all
- [ ] Edit student: add country → verify new tasks appear
- [ ] Edit student: remove country → verify tasks handled correctly
- [ ] View student list → verify countries display correctly

### Student UI Testing
- [ ] Login as multi-country student
- [ ] View task list → verify all countries' tasks appear
- [ ] Open document upload → verify Passport appears once
- [ ] Upload Passport → verify it disappears from requirements
- [ ] Verify country-specific documents appear correctly

---

## Definition of Done - Phase 5

- [ ] All backend unit tests written and passing
- [ ] All integration tests written and passing
- [ ] All frontend tests written and passing
- [ ] All E2E tests written and passing
- [ ] Test coverage reports generated
- [ ] Manual testing completed
- [ ] No critical bugs found
- [ ] All test scenarios from Gherkin documented and covered
