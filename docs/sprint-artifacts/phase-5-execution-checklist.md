# Phase 5 Execution Checklist - Developer Quick Start

**Goal:** Complete all testing for the Multi-Country feature  
**Estimated Time:** 8-12 hours  
**Prerequisites:** Phases 1-4 complete ✅

---

## 🎯 Before You Start

- [ ] Read [`multi-country-testing-plan.md`](./multi-country-testing-plan.md)
- [ ] Read [`multi-country-plan.md`](./multi-country-plan.md) (Phases 1-4 for context)
- [ ] Ensure development database is seeded with test data
- [ ] Ensure test environment is configured

---

## 📝 Task Order (Recommended)

### Step 1: Backend Unit Tests (3-4 hours)

#### 1.1 TasksService Tests
```bash
cd backend
touch src/tasks/tasks.service.spec.ts  # if not exists
```

**Test Cases to Implement:**
- [x] `should sync tasks for single country (backward compatibility)`
- [x] `should sync tasks for multiple countries`
- [x] `should handle empty country array`
- [x] `should prevent duplicate task creation`
- [x] `should log sync progress for each country`
- [x] `should handle invalid country ID gracefully`

**Run Tests:**
```bash
npm run test -- tasks.service.spec.ts
```

---

#### 1.2 DocumentsService Tests
```bash
touch src/documents/documents.service.spec.ts  # if not exists
```

**Test Cases to Implement:**
- [x] `should deduplicate Passport for multi-country student`
- [x] `should exclude already uploaded Passport`
- [x] `should show country-specific documents for each country`
- [x] `should handle student with no countries`

**Run Tests:**
```bash
npm run test -- documents.service.spec.ts
```

---

### Step 2: Integration Tests (2-3 hours)

#### 2.1 Student Management E2E
```bash
touch test/student-management.e2e-spec.ts  # if not exists
```

**Test Cases to Implement:**
- [x] `POST /api/admin/students with multiple countries`
- [x] `PATCH /api/admin/students/:id - add country`
- [x] `PATCH /api/admin/students/:id - remove country`
- [x] `should sync tasks when countries change`
- [x] `should preserve DONE tasks when country removed`
- [x] `should validate country IDs`

**Run Tests:**
```bash
npm run test:e2e
```

---

### Step 3: Frontend Tests (2-3 hours)

#### 3.1 StudentModal Tests
```bash
cd ../frontend
touch src/components/students/StudentModal.test.tsx  # if not exists
```

**Test Cases to Implement:**
- [ ] `should render multi-select country picker`
- [ ] `should allow selecting multiple countries`
- [ ] `should display selected countries as pills`
- [ ] `should validate at least one country required`
- [ ] `should submit with countryIds array`
- [ ] `should handle deselection`

**Run Tests:**
```bash
npm run test -- StudentModal.test.tsx
```

---

#### 3.2 DocumentUploadModal Tests
```bash
touch src/components/documents/DocumentUploadModal.test.tsx  # if not exists
```

**Test Cases to Implement:**
- [ ] `should show Passport only once for multi-country student`
- [ ] `should exclude already uploaded documents`
- [ ] `should show country-specific documents`

**Run Tests:**
```bash
npm run test -- DocumentUploadModal.test.tsx
```

---

### Step 4: End-to-End Tests (2-3 hours)

#### 4.1 Full Multi-Country Flow
```bash
cd ../e2e  # or wherever E2E tests are
touch multi-country-flow.spec.ts  # if not exists
```

**Test Scenarios to Implement:**
- [ ] Admin creates student with 2 countries
- [ ] Verify tasks appear for both countries
- [ ] Student uploads Passport (appears once)
- [ ] Verify document deduplication works
- [ ] Admin adds 3rd country
- [ ] Verify new tasks created
- [ ] Admin removes country
- [ ] Verify TODO tasks archived, DONE tasks kept

**Run Tests:**
```bash
npm run test:e2e
# or
npx playwright test multi-country-flow.spec.ts
```

---

### Step 5: Manual Testing (1-2 hours)

#### 5.1 Admin UI Testing
- [ ] Open `http://localhost:3000/admin/students`
- [ ] Click "Create Student"
- [ ] Select Austria and Germany
- [ ] Submit form
- [ ] Verify student appears with "Austria, Germany"
- [ ] Click on student
- [ ] Verify tasks from both countries appear
- [ ] Click "Edit Student"
- [ ] Add Poland
- [ ] Save
- [ ] Verify new tasks for Poland appear

#### 5.2 Student UI Testing
- [ ] Login as multi-country student
- [ ] Open task list
- [ ] Verify tasks from all countries visible
- [ ] Open document upload modal
- [ ] Verify Passport appears only once
- [ ] Verify country-specific docs appear for each country
- [ ] Upload Passport
- [ ] Reopen modal
- [ ] Verify Passport no longer in requirements

---

## 🧪 Test Commands Reference

### Backend
```bash
# Run all backend tests
cd backend
npm run test

# Run specific test file
npm run test -- tasks.service.spec.ts

# Run with coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Frontend
```bash
# Run all frontend tests
cd frontend
npm run test

# Run specific test file
npm run test -- StudentModal.test.tsx

# Watch mode
npm run test -- --watch

# Coverage
npm run test -- --coverage
```

### E2E
```bash
# Run all E2E tests
npm run test:e2e

# Run specific suite
npm run test:e2e -- student-management.e2e-spec.ts

# With UI (Playwright)
npx playwright test --ui
```

---

## ✅ Definition of Done - Phase 5

- [ ] All backend unit tests written and passing
- [ ] All integration tests written and passing
- [ ] All frontend tests written and passing
- [ ] All E2E tests written and passing
- [ ] Test coverage > 80% on modified files
- [ ] No console errors during manual testing
- [ ] All test scenarios from [`multi-country-testing-plan.md`](./multi-country-testing-plan.md) covered
- [ ] Test results documented

---

## 📊 Progress Tracking

Update this section as you complete tasks:

**Backend Unit Tests:** [x] 18/18 test cases ✅  
- TasksService: 9/9 tests passing
- DocumentsService: 9/9 tests passing

**Integration Tests:** [x] 9/9 test cases ✅  
- Student Management E2E: 9/9 tests passing

**Frontend Tests:** [ ] 0/9 test cases  
**Manual Testing:** [ ] 0/10 checks  

**Total Progress:** 54% (27/50 tests) → Target: 100%

---

## 🐛 Issues & Blockers

Document any issues you encounter:

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| (none yet) | - | - | - |

---

## 📝 Notes & Learnings

(Add any notes, gotchas, or learnings as you work)

---

## 🚀 After Completion

Once all tests pass:
1. [ ] Update [`multi-country-plan.md`](./multi-country-plan.md) → Mark Phase 5 as ✅ Complete
2. [ ] Generate test coverage report
3. [ ] Document any test failures and resolutions
4. [ ] Notify team that Phase 5 is complete
5. [ ] Prepare for Phase 6 (Deployment)

---

**Quick Links:**
- [Master Plan](./multi-country-plan.md)
- [Detailed Testing Plan](./multi-country-testing-plan.md)
- [Deployment Plan](./multi-country-deployment-plan.md)
- [Executive Summary](./multi-country-executive-summary.md)
