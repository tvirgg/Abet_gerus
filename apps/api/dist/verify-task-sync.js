#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./entities/student.entity");
const task_template_entity_1 = require("./entities/task-template.entity");
const task_entity_1 = require("./entities/task.entity");
require("dotenv/config");
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [student_entity_1.Student, task_template_entity_1.TaskTemplate, task_entity_1.Task],
    synchronize: false,
});
async function verifyTaskSync() {
    await AppDataSource.initialize();
    console.log("✅ Database connected\n");
    const studentRepo = AppDataSource.getRepository(student_entity_1.Student);
    const templateRepo = AppDataSource.getRepository(task_template_entity_1.TaskTemplate);
    const taskRepo = AppDataSource.getRepository(task_entity_1.Task);
    console.log("=== 1. Checking TaskTemplates ===");
    const austriaTemplates = await templateRepo.find({ where: { countryId: 'at' } });
    const italyTemplates = await templateRepo.find({ where: { countryId: 'it' } });
    console.log(`Austria (AT) templates: ${austriaTemplates.length}`);
    console.log(`Italy (IT) templates: ${italyTemplates.length}`);
    if (austriaTemplates.length === 0) {
        console.error("❌ NO AUSTRIA TEMPLATES FOUND - This is the bug!");
    }
    else {
        console.log("✅ Austria templates exist");
        console.log("Sample Austrian tasks:");
        austriaTemplates.forEach((t, i) => {
            console.log(`  ${i + 1}. [${t.stage}] ${t.title} (${t.xpReward} XP)`);
        });
    }
    console.log("\n=== 2. Checking Students ===");
    const students = await studentRepo.find();
    console.log(`Total students: ${students.length}`);
    for (const student of students) {
        console.log(`\n  Student: ${student.fullName} (ID: ${student.id})`);
        console.log(`  Country: ${student.countryId}`);
        console.log(`  Programs: ${JSON.stringify(student.selectedProgramIds || [])}`);
        const tasks = await taskRepo.find({ where: { studentId: student.id } });
        console.log(`  Tasks: ${tasks.length}`);
        if (student.countryId === 'at' && tasks.length === 0) {
            console.error(`  ❌ BUG REPRODUCED: Austrian student has 0 tasks!`);
        }
        else if (tasks.length > 0) {
            console.log(`  ✅ Tasks created successfully`);
            console.log(`  Sample tasks:`);
            tasks.slice(0, 3).forEach((t, i) => {
                console.log(`    ${i + 1}. [${t.status}] ${t.title}`);
            });
        }
    }
    console.log("\n=== 3. Recommendations ===");
    if (austriaTemplates.length === 0) {
        console.log("⚠️  Run: npm run seed");
        console.log("    This will populate TaskTemplates for Austria");
    }
    if (students.some(s => s.countryId === 'at')) {
        const austrianStudent = students.find(s => s.countryId === 'at');
        if (austrianStudent) {
            const tasks = await taskRepo.find({ where: { studentId: austrianStudent.id } });
            if (tasks.length === 0 && austriaTemplates.length > 0) {
                console.log("⚠️  Templates exist but student has no tasks");
                console.log("    Manually trigger sync via: POST /api/tasks/sync");
                console.log(`    Or call: tasksService.syncStudentTasks('${austrianStudent.id}')`);
            }
        }
    }
    console.log("\n✅ Verification complete!");
    process.exit(0);
}
verifyTaskSync().catch((err) => {
    console.error("❌ Verification error", err);
    process.exit(1);
});
