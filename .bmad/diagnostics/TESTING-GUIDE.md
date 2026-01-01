# 🧪 Quick Test Guide: Task Sync Bug Fix

## Option 1: Database Verification (SQL)

```bash
# Check TaskTemplates exist
psql $DATABASE_URL -c "SELECT country_id, COUNT(*) FROM task_template GROUP BY country_id;"
# Expected: at=6, it=6

# Check students have tasks
psql $DATABASE_URL -c "
SELECT s.full_name, s.country_id, COUNT(t.id) as tasks 
FROM student s 
LEFT JOIN task t ON t.student_id = s.id 
GROUP BY s.id, s.full_name, s.country_id;
"
# Expected: Each student with country_id='at' should have 6 tasks
```

---

## Option 2: API Test (Registration Flow)

### Start the API Server
```bash
cd apps/api
npm run start:dev
```

### Create Austrian Student
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-bug-fix@example.com",
    "password": "test123",
    "fullName": "Austrian Test Student",
    "countryId": "at"
  }'
```

### Expected Console Output:
```
[DEBUG] 🔄 syncStudentTasks called for studentId: <uuid>
[DEBUG] ✅ Student found: Austrian Test Student, Country: at, Programs: []
[DEBUG] 📋 Found 6 applicable templates for country 'at'
[DEBUG] 🆕 Will create 6 new tasks
[DEBUG] ✅ Created 6 new tasks for student Austrian Test Student
```

### Verify Tasks Were Created
```bash
# Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test-bug-fix@example.com", "password": "test123"}'

# Copy the accessToken from response

# Get tasks
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <YOUR_TOKEN>"

# Expected: Array of 6 tasks with status: "TODO"
```

---

## Option 3: Admin Panel Test

### Start Both Servers
```bash
# Terminal 1
npm run dev:api

# Terminal 2  
npm run dev:web
```

### Test Flow
1. Navigate to `http://localhost:5173/admin/students`
2. Click "Add Student"
3. Fill form:
   - Full Name: "Admin Panel Test"
   - Email: "admin-test@example.com"
   - Country: Select "Austria" from dropdown
   - (Leave password blank - will auto-generate)
4. Click "Create"
5. Look for [DEBUG] logs in Terminal 1 API console
6. Navigate to `/students` (student dashboard)
7. **Expected:** 6 tasks visible in dashboard

---

## Expected Debug Log Pattern

```
[DEBUG] 🔄 syncStudentTasks called for studentId: abc-123-def
[DEBUG] ✅ Student found: <Name>, Country: at, Programs: []
[DEBUG] 📋 Found 6 applicable templates for country 'at'
[DEBUG] 📝 Student has 0 existing tasks
[DEBUG] 🆕 Will create 6 new tasks
[DEBUG] ✅ Created 6 new tasks for student <Name>
```

## ❌ Bad Pattern (Bug Still Exists)

```
[DEBUG] 🔄 syncStudentTasks called for studentId: abc-123-def
[DEBUG] ✅ Student found: <Name>, Country: at, Programs: []
[DEBUG] ❌ NO TEMPLATES FOUND for countryId: 'at' - check seed.ts! Run: npm run seed
```

**Fix:** Run `npm run seed` in `apps/api` directory

---

## Quick Troubleshooting

### Problem: "NO TEMPLATES FOUND"
**Solution:**
```bash
cd apps/api
npm run seed
```

### Problem: "TasksService not found" error in AdminService
**Solution:** Check `apps/api/src/admin/admin.module.ts` has:
```typescript
imports: [
  TypeOrmModule.forFeature([...]),
  TasksModule  // Must be imported
]
```

### Problem: No debug logs appearing
**Solution:** Check `apps/api/src/tasks/tasks.service.ts` has console.log statements (lines 73-135)

---

## Success Criteria

✅ Seed script outputs: `✅ TaskTemplates seeded: 12 templates`  
✅ Creating Austrian student shows debug logs with "Found 6 applicable templates"  
✅ Database query shows 6 tasks for new Austrian student  
✅ Student dashboard displays 6 TODO tasks  
✅ No errors in console

---

**Last Updated:** 2026-01-02  
**Related Docs:**  
- `.bmad/diagnostics/task-sync-audit.md`
- `.bmad/diagnostics/step1-implementation-summary.md`
