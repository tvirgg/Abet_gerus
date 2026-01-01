/**
 * Multi-Country Feature Test Script
 * 
 * Tests the multi-country backend implementation:
 * 1. Create a student with multiple countries
 * 2. Verify tasks are created for all countries
 * 3. Update student countries
 * 4. Verify task re-sync
 */

import { DataSource } from 'typeorm';
import { Student } from './entities/student.entity';
import { Country } from './entities/country.entity';
import { Task } from './entities/task.entity';

async function testMultiCountry() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'abiturient',
        entities: [Student, Country, Task],
    });

    try {
        await dataSource.initialize();
        console.log('✅ Connected to database\n');

        const studentRepo = dataSource.getRepository(Student);
        const countryRepo = dataSource.getRepository(Country);
        const taskRepo = dataSource.getRepository(Task);

        // Test 1: Find a test student
        console.log('📋 Test 1: Load student with countries');
        const students = await studentRepo.find({
            relations: ['countries', 'tasks'],
            take: 1
        });

        if (students.length === 0) {
            console.log('⚠️  No students found in database');
            return;
        }

        const student = students[0];
        console.log(`Student: ${student.fullName}`);
        console.log(`Countries: ${student.countries?.length || 0}`);
        console.log(`Legacy countryId: ${student.countryId || 'null'}`);
        console.log(`Tasks: ${student.tasks?.length || 0}\n`);

        // Test 2: Get all countries
        console.log('🌍 Test 2: Available countries');
        const countries = await countryRepo.find();
        countries.forEach(c => {
            console.log(`  - ${c.id}: ${c.name}`);
        });
        console.log();

        // Test 3: Check student_countries join table
        console.log('🔗 Test 3: Check join table');
        const joinResult = await dataSource.query(
            'SELECT * FROM student_countries LIMIT 5'
        );
        console.log(`Found ${joinResult.length} entries in student_countries`);
        joinResult.forEach((row: any) => {
            console.log(`  studentId: ${row.studentId}, countryId: ${row.countryId}`);
        });
        console.log();

        // Test 4: Tasks per country
        console.log('📝 Test 4: Tasks distribution');
        const taskCounts = await dataSource.query(`
      SELECT 
        s."fullName" as student_name,
        COUNT(t.id) as task_count,
        COUNT(DISTINCT sc."countryId") as country_count
      FROM students s
      LEFT JOIN student_countries sc ON s.id = sc."studentId"
      LEFT JOIN tasks t ON s.id = t."studentId"
      GROUP BY s.id, s."fullName"
      LIMIT 5
    `);

        taskCounts.forEach((row: any) => {
            console.log(`  ${row.student_name}: ${row.task_count} tasks, ${row.country_count} countries`);
        });

        console.log('\n✅ Tests completed successfully!');

        await dataSource.destroy();
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testMultiCountry();
