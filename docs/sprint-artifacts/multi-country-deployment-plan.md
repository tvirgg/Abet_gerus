# Multi-Country Deployment Plan

## Overview
This document outlines the deployment strategy for the Multi-Country feature.

**Status:** Ready for execution after Phase 5 complete  
**Risk Level:** Medium (schema changes + data migration)  
**Estimated Downtime:** 5-10 minutes  
**Rollback Time:** < 2 minutes

---

## Phase 6.1: Data Migration Strategy

### Current State Analysis

**Current Schema:**
```sql
-- Students table (may have single countryId column)
students
  - id (PK)
  - countryId (FK) -- DEPRECATED
  
-- New join table (already created by migration)
student_countries
  - studentId (FK)
  - countryId (FK)
```

### Migration Requirements

1. **Migrate existing single-country students to new schema**
2. **Preserve all existing data**
3. **Ensure zero data loss**

---

### Migration Script: Phase 6.1.1

**File:** `backend/migrations/data/migrate-student-countries.ts`

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateStudentCountriesData1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Check if old countryId column exists
    const hasOldColumn = await queryRunner.hasColumn('students', 'countryId');
    
    if (!hasOldColumn) {
      console.log('⚠️ Old countryId column not found. Skipping migration.');
      return;
    }

    console.log('📊 Starting data migration for student countries...');

    // Step 2: Migrate data from students.countryId to student_countries table
    await queryRunner.query(`
      INSERT INTO student_countries ("studentId", "countryId")
      SELECT id, "countryId"
      FROM students
      WHERE "countryId" IS NOT NULL
    `);

    console.log('✅ Data migrated to student_countries table');

    // Step 3: Drop old countryId column (optional, keep for rollback safety)
    // Uncomment after verifying migration success:
    // await queryRunner.dropColumn('students', 'countryId');
    
    console.log('✅ Migration complete');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: Restore old countryId column from student_countries
    const hasOldColumn = await queryRunner.hasColumn('students', 'countryId');
    
    if (!hasOldColumn) {
      await queryRunner.addColumn('students', new TableColumn({
        name: 'countryId',
        type: 'uuid',
        isNullable: true,
      }));
    }

    // Restore data (take first country if multiple)
    await queryRunner.query(`
      UPDATE students s
      SET "countryId" = (
        SELECT "countryId"
        FROM student_countries sc
        WHERE sc."studentId" = s.id
        LIMIT 1
      )
    `);

    console.log('✅ Rollback complete');
  }
}
```

**Checklist:**
- [ ] Create migration file
- [ ] Test migration on development database
- [ ] Verify data integrity after migration
- [ ] Document rollback procedure

---

### Migration Script: Phase 6.1.2 - Validation

**File:** `backend/scripts/validate-migration.ts`

```typescript
import { AppDataSource } from '../src/config/database';
import { Student } from '../src/entities/Student';

async function validateMigration() {
  await AppDataSource.initialize();

  console.log('🔍 Validating migration...');

  // 1. Check all students have at least one country
  const studentsWithoutCountries = await AppDataSource
    .getRepository(Student)
    .createQueryBuilder('student')
    .leftJoin('student.countries', 'country')
    .where('country.id IS NULL')
    .getMany();

  if (studentsWithoutCountries.length > 0) {
    console.error(`❌ Found ${studentsWithoutCountries.length} students without countries`);
    console.error('Student IDs:', studentsWithoutCountries.map(s => s.id));
  } else {
    console.log('✅ All students have at least one country');
  }

  // 2. Check for data integrity
  const totalStudents = await AppDataSource.getRepository(Student).count();
  const totalRelations = await AppDataSource
    .createQueryBuilder()
    .select('COUNT(*)', 'count')
    .from('student_countries', 'sc')
    .getRawOne();

  console.log(`📊 Total students: ${totalStudents}`);
  console.log(`📊 Total student-country relations: ${totalRelations.count}`);

  if (parseInt(totalRelations.count) < totalStudents) {
    console.warn('⚠️ Some students may have no countries assigned');
  }

  // 3. Check for orphaned records
  const orphanedRecords = await AppDataSource.query(`
    SELECT COUNT(*) as count
    FROM student_countries sc
    LEFT JOIN students s ON s.id = sc."studentId"
    WHERE s.id IS NULL
  `);

  if (parseInt(orphanedRecords[0].count) > 0) {
    console.error(`❌ Found ${orphanedRecords[0].count} orphaned records`);
  } else {
    console.log('✅ No orphaned records found');
  }

  await AppDataSource.destroy();
  console.log('✅ Validation complete');
}

validateMigration().catch(console.error);
```

**Checklist:**
- [ ] Create validation script
- [ ] Run validation after migration
- [ ] Document any issues found
- [ ] Fix data inconsistencies before deployment

---

## Phase 6.2: Staging Environment Checklist

### Pre-Deployment on Staging

- [ ] **Backup database**
  ```bash
  pg_dump -h [staging-host] -U [user] -d abiturient_staging > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Pull latest code**
  ```bash
  git checkout main
  git pull origin main
  ```

- [ ] **Install dependencies**
  ```bash
  cd backend && npm install
  cd frontend && npm install
  ```

- [ ] **Run migration (dry-run)**
  ```bash
  npm run migration:show
  ```

- [ ] **Run actual migration**
  ```bash
  npm run migration:run
  ```

- [ ] **Run data migration**
  ```bash
  npm run migration:run -- -d
  ```

- [ ] **Run validation script**
  ```bash
  npm run script:validate-migration
  ```

- [ ] **Restart backend services**
  ```bash
  pm2 restart abiturient-backend
  ```

- [ ] **Check logs for errors**
  ```bash
  pm2 logs abiturient-backend --lines 100
  ```

### Functional Testing on Staging

- [ ] **Admin UI Testing**
  - [ ] Login as admin
  - [ ] View existing students → verify countries display
  - [ ] Create new student with multiple countries
  - [ ] Edit student: add/remove countries
  - [ ] Verify tasks sync correctly

- [ ] **Student UI Testing**
  - [ ] Login as multi-country student
  - [ ] View task list
  - [ ] Open document upload modal
  - [ ] Verify Passport deduplication works

- [ ] **API Testing**
  - [ ] GET /api/admin/students → verify country data
  - [ ] POST /api/admin/students → test creation
  - [ ] PATCH /api/admin/students/:id → test updates
  - [ ] GET /api/documents/requirements → verify deduplication

- [ ] **Performance Testing**
  - [ ] Check page load times
  - [ ] Verify no N+1 query issues
  - [ ] Monitor database query performance

### Rollback Plan (if needed)

If issues are found on staging:

```bash
# 1. Rollback migration
npm run migration:revert

# 2. Restore database from backup
psql -h [staging-host] -U [user] -d abiturient_staging < backup_[timestamp].sql

# 3. Restart services
pm2 restart abiturient-backend

# 4. Verify system is stable
curl https://staging.abiturient.kz/api/health
```

---

## Phase 6.3: Production Deployment

### Pre-Deployment Checklist

- [ ] **All tests passing on staging**
- [ ] **Code review completed**
- [ ] **Product owner approval obtained**
- [ ] **Schedule deployment window** (low-traffic period recommended)
- [ ] **Notify team of deployment**
- [ ] **Prepare rollback plan**

### Deployment Window Planning

**Recommended Time:** Friday, 22:00 - 23:00 (GMT+5)  
**Reason:** Low user activity  
**Estimated Duration:** 30 minutes  
**Downtime:** 5-10 minutes

### Deployment Steps

#### Step 1: Pre-Deployment Backup (T-15 min)

```bash
# 1. Backup production database
ssh production-server
pg_dump -h localhost -U postgres -d abiturient_prod > /backups/abiturient_prod_$(date +%Y%m%d_%H%M%S).sql

# 2. Verify backup file size
ls -lh /backups/abiturient_prod_*.sql
```

**Checklist:**
- [ ] Backup created successfully
- [ ] Backup file size is reasonable (not 0 bytes)
- [ ] Backup stored in safe location

---

#### Step 2: Deploy Backend (T-10 min)

```bash
# 1. Pull latest code
cd /var/www/abiturient-backend
git pull origin main

# 2. Install dependencies
npm install --production

# 3. Run migration (dry-run first)
npm run migration:show

# 4. Run schema migration
npm run migration:run

# 5. Run data migration
npm run migration:run -- -d

# 6. Run validation
npm run script:validate-migration
```

**Checklist:**
- [ ] Code pulled successfully
- [ ] Dependencies installed
- [ ] Migration executed without errors
- [ ] Validation passed

---

#### Step 3: Restart Services (T-5 min)

```bash
# Restart backend
pm2 restart abiturient-backend

# Check status
pm2 status

# Monitor logs for errors
pm2 logs abiturient-backend --lines 50
```

**Checklist:**
- [ ] Service restarted successfully
- [ ] No errors in logs
- [ ] Health check endpoint responding

---

#### Step 4: Deploy Frontend (T-3 min)

```bash
cd /var/www/abiturient-frontend
git pull origin main
npm install
npm run build
pm2 restart abiturient-frontend
```

**Checklist:**
- [ ] Frontend built successfully
- [ ] Static files served correctly
- [ ] No console errors on homepage

---

#### Step 5: Smoke Testing (T+0 min)

**Manual Tests:**
- [ ] **Homepage loads**
- [ ] **Admin login works**
- [ ] **Student list displays with countries**
- [ ] **Create new student with multiple countries**
- [ ] **Edit existing student**
- [ ] **Student login works**
- [ ] **Task list displays**
- [ ] **Document upload modal opens**

**API Tests:**
```bash
# Health check
curl https://abiturient.kz/api/health

# Get students (with auth token)
curl -H "Authorization: Bearer [TOKEN]" https://abiturient.kz/api/admin/students
```

**Checklist:**
- [ ] All smoke tests pass
- [ ] No 500 errors
- [ ] Response times acceptable

---

#### Step 6: Monitoring (T+15 min)

**Metrics to watch:**
- [ ] Error rate (should be < 1%)
- [ ] Response time (should be < 500ms p95)
- [ ] Database connections (should not spike)
- [ ] Memory usage (should be stable)

**Tools:**
```bash
# Monitor logs
pm2 logs abiturient-backend --lines 200

# Check system resources
htop

# Database connections
psql -c "SELECT count(*) FROM pg_stat_activity;"
```

---

### Rollback Procedure

**If critical issues occur:**

```bash
# 1. Stop services
pm2 stop abiturient-backend abiturient-frontend

# 2. Checkout previous version
cd /var/www/abiturient-backend
git checkout [previous-commit-hash]
cd /var/www/abiturient-frontend
git checkout [previous-commit-hash]

# 3. Rollback database migration
cd /var/www/abiturient-backend
npm run migration:revert

# Alternative: Restore from backup
psql -h localhost -U postgres -d abiturient_prod < /backups/abiturient_prod_[timestamp].sql

# 4. Restart services
pm2 restart abiturient-backend abiturient-frontend

# 5. Verify rollback
curl https://abiturient.kz/api/health
```

**Checklist:**
- [ ] Services stopped
- [ ] Code reverted
- [ ] Database rolled back
- [ ] Services restarted
- [ ] Smoke tests pass

---

## Phase 6.4: Post-Deployment

### Immediate Post-Deployment (Day 1)

- [ ] Monitor error logs for 24 hours
- [ ] Check user feedback channels
- [ ] Review database performance
- [ ] Verify no data corruption

### Week 1 Monitoring

- [ ] Analyze user behavior with multi-country feature
- [ ] Collect feedback from admin users
- [ ] Monitor document upload success rate
- [ ] Review task sync performance

### Optimization (if needed)

- [ ] Add database indexes if queries are slow
- [ ] Optimize frontend rendering for multi-country display
- [ ] Cache country data on frontend

---

## Definition of Done - Phase 6

- [ ] Data migration script created and tested
- [ ] Validation script created and passing
- [ ] Staging deployment successful
- [ ] Production deployment successful
- [ ] All smoke tests passing
- [ ] No critical bugs reported in first 24 hours
- [ ] Rollback plan documented and verified
- [ ] Team trained on new multi-country feature
- [ ] Documentation updated (user guides, admin guides)

---

## Communication Plan

### Pre-Deployment
- [ ] Notify stakeholders 48 hours before deployment
- [ ] Send deployment schedule to team
- [ ] Prepare user announcement (if needed)

### During Deployment
- [ ] Post status updates in team Slack/Discord
- [ ] Keep stakeholders informed of progress

### Post-Deployment
- [ ] Send "deployment successful" notification
- [ ] Share any issues encountered and resolutions
- [ ] Document lessons learned

---

## Contacts

**On-Call During Deployment:**
- Backend Lead: [Name]
- Frontend Lead: [Name]
- DevOps: [Name]
- Product Owner: [Name]
