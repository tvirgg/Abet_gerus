# Task Sync Diagnostics Report
**Date:** 2026-01-02  
**Issue:** Austrian students don't get tasks after creation

---

## Root Causes Identified

### 1. ❌ **Missing TaskTemplates in Database**
- **File:** `apps/api/src/seed.ts`
- **Problem:** Seed script creates Countries, Universities, Programs, but NOT TaskTemplates
- **Evidence:** No `taskTplRepo.save()` calls for Austria templates
- **Result:** `syncStudentTasks()` finds 0 templates → returns early → 0 tasks created

### 2. ⚠️ **Admin.createStudent() Doesn't Sync Tasks**
- **File:** `apps/api/src/admin/admin.service.ts` (line 171-202)
- **Problem:** Method creates User + Student but never calls `tasksService.syncStudentTasks()`
- **Evidence:** Auth.register() calls it (line 105), but Admin service doesn't
- **Result:** Students created via Admin Panel won't get tasks

### 3. ✅ **syncStudentTasks Logic is Sound** 
- **File:** `apps/api/src/tasks/tasks.service.ts` (line 73-119)
- **Status:** Logic correctly queries templates and creates tasks
- **Note:** Will work once templates are seeded

---

## Immediate Action Plan

### Phase 1: Seed TaskTemplates for Austria
**File to modify:** `apps/api/src/seed.ts`

Add after line 121 (after Universities & Programs):

```typescript
// 4. TaskTemplates for Austria
const taskTplRepo = AppDataSource.getRepository(TaskTemplate);
const austriaTasks = [
  { countryId: 'at', title: "Загрузить скан загранпаспорта", stage: "Документы", xpReward: 20, description: "Загрузите PDF скан главной страницы паспорта." },
  { countryId: 'at', title: "Сделать фото для визы", stage: "Документы", xpReward: 15, description: "Фото 3.5х4.5 на белом фоне." },
  { countryId: 'at', title: "Перевести аттестат/диплом", stage: "Документы", xpReward: 50, description: "Нотариально заверенный перевод на английский или немецкий." },
  { countryId: 'at', title: "Выбрать программу обучения", stage: "Подготовка", xpReward: 10, description: "Изучите программы в австрийских университетах." },
  { countryId: 'at', title: "Написать мотивационное письмо", stage: "Творчество", xpReward: 60, description: "Черновик письма на немецком или английском." },
  { countryId: 'at', title: "Подать заявку на визу", stage: "Виза", xpReward: 100, description: "Запись в консульство Австрии." }
];

for (const t of austriaTasks) {
  const existing = await taskTplRepo.findOne({ 
    where: { countryId: t.countryId, title: t.title } 
  });
  if (!existing) {
    await taskTplRepo.save(taskTplRepo.create(t));
  }
}
console.log("✅ Austria TaskTemplates seeded");
```

### Phase 2: Fix Admin.createStudent()
**File to modify:** `apps/api/src/admin/admin.service.ts`

Inject TasksService at line 29 and call sync:

```typescript
// In constructor (line 29)
private tasksService: TasksService

// At end of createStudent() (after line 200)
await this.tasksService.syncStudentTasks(student.id);
```

### Phase 3: Add Debug Logs
**File to modify:** `apps/api/src/tasks/tasks.service.ts`

Add logging to line 73-90:

```typescript
async syncStudentTasks(studentId: string) {
  console.log(`[DEBUG] syncStudentTasks called for studentId: ${studentId}`);
  
  const student = await this.studentRepo.findOne({ where: { id: studentId } });
  if (!student) {
    console.log(`[DEBUG] Student not found: ${studentId}`);
    return;
  }

  console.log(`[DEBUG] Student found: ${student.fullName}, Country: ${student.countryId}, Programs: ${student.selectedProgramIds}`);

  const programIds = student.selectedProgramIds || [];
  const countryId = student.countryId;

  const applicableTemplates = await this.templateRepo.find({
    where: [
      { countryId: countryId, programId: undefined },
      ...(programIds.length > 0 ? programIds.map(pid => ({ programId: pid, countryId: countryId })) : [])
    ]
  });

  console.log(`[DEBUG] Found ${applicableTemplates.length} templates for country ${countryId}`);
  
  if (applicableTemplates.length === 0) {
    console.warn(`⚠️ NO TEMPLATES FOUND for countryId: ${countryId} - check seed.ts!`);
    return;
  }
  // ... rest of method
}
```

---

## Testing Checklist

- [ ] Run `npm run seed` to populate TaskTemplates
- [ ] Create test student via API: `POST /api/auth/register` with `countryId: 'at'`
- [ ] Check logs for `[DEBUG]` messages
- [ ] Verify tasks created: `GET /api/tasks`
- [ ] Create student via Admin UI
- [ ] Confirm Admin-created students also get tasks

---

## Multi-Country Strategy (Future)

For Phase 2 (students applying to multiple countries):

1. **Schema Change:** Add `targetCountryIds: string[]` to Student entity
2. **Deduplication:** Use `Set<string>` keyed by `${title}-${stage}` to prevent duplicates
3. **Task Metadata:** Add `sourceCountryId` / `sourceProgramId` to track task origin
4. **Sync Logic:** Merge templates from ALL target countries

Example:
```typescript
const allTemplates = [];
for (const cId of student.targetCountryIds) {
  const templates = await this.templateRepo.find({ where: { countryId: cId } });
  allTemplates.push(...templates);
}

// Deduplicate by title+stage
const uniqueMap = new Map();
for (const tpl of allTemplates) {
  const key = `${tpl.stage}-${tpl.title}`;
  if (!uniqueMap.has(key)) uniqueMap.set(key, tpl);
}

const uniqueTemplates = Array.from(uniqueMap.values());
```
