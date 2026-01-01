"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const task_entity_1 = require("../entities/task.entity");
const student_entity_1 = require("../entities/student.entity");
const task_template_entity_1 = require("../entities/task-template.entity");
const enums_1 = require("../entities/enums");
const archiver_1 = __importDefault(require("archiver"));
const files_service_1 = require("../files/files.service");
let TasksService = class TasksService {
    constructor(taskRepo, studentRepo, templateRepo, filesService) {
        this.taskRepo = taskRepo;
        this.studentRepo = studentRepo;
        this.templateRepo = templateRepo;
        this.filesService = filesService;
    }
    async findAllForUser(userId) {
        const student = await this.studentRepo.findOne({ where: { userId } });
        if (!student)
            throw new common_1.NotFoundException("Student profile not found");
        return this.taskRepo.find({
            where: { studentId: student.id },
            order: { id: 'ASC' }
        });
    }
    async submitTask(taskId, submission) {
        await this.taskRepo.update(taskId, {
            status: enums_1.TaskStatus.REVIEW,
            submission: submission
        });
        return this.taskRepo.findOneBy({ id: Number(taskId) });
    }
    async getReviewQueue() {
        return this.taskRepo.find({
            where: { status: enums_1.TaskStatus.REVIEW },
            relations: ['student']
        });
    }
    async approveTask(taskId) {
        const task = await this.taskRepo.findOneBy({ id: Number(taskId) });
        if (!task)
            throw new common_1.NotFoundException();
        task.status = enums_1.TaskStatus.DONE;
        await this.taskRepo.save(task);
        const student = await this.studentRepo.findOneBy({ id: task.studentId });
        if (student) {
            student.xpTotal += task.xpReward;
            await this.studentRepo.save(student);
        }
        return task;
    }
    async requestChanges(taskId, comment) {
        const task = await this.taskRepo.findOneBy({ id: Number(taskId) });
        if (!task)
            throw new common_1.NotFoundException();
        task.status = enums_1.TaskStatus.CHANGES_REQUESTED;
        await this.taskRepo.save(task);
        return task;
    }
    async syncStudentTasks(studentId) {
        console.log(`[DEBUG] 🔄 syncStudentTasks called for studentId: ${studentId}`);
        const student = await this.studentRepo.findOne({
            where: { id: studentId },
            relations: ['countries']
        });
        if (!student) {
            console.warn(`[DEBUG] ⚠️ Student not found: ${studentId}`);
            return;
        }
        console.log(`[DEBUG] ✅ Student found: ${student.fullName}, Countries: ${student.countries?.length || 0}, Programs: ${JSON.stringify(student.selectedProgramIds || [])}`);
        const countryIds = student.countries?.length > 0
            ? student.countries.map(c => c.id)
            : (student.countryId ? [student.countryId] : []);
        if (countryIds.length === 0) {
            console.warn(`[DEBUG] ⚠️ No countries selected for student ${student.fullName}`);
            return;
        }
        console.log(`[DEBUG] 📍 Syncing tasks for ${countryIds.length} countries: ${countryIds.join(', ')}`);
        const programIds = student.selectedProgramIds || [];
        for (const countryId of countryIds) {
            console.log(`[DEBUG] 🌍 Processing country: ${countryId}`);
            const applicableTemplates = await this.templateRepo.find({
                where: [
                    { countryId: countryId, programId: undefined },
                    ...(programIds.length > 0 ? programIds.map(pid => ({ programId: pid, countryId: countryId })) : [])
                ]
            });
            console.log(`[DEBUG] 📋 Found ${applicableTemplates.length} templates for country '${countryId}'`);
            if (applicableTemplates.length === 0) {
                console.error(`[DEBUG] ❌ NO TEMPLATES for countryId: '${countryId}' - check seed.ts!`);
                continue;
            }
            const existingTasks = await this.taskRepo.find({
                where: { studentId: student.id },
                select: ['title', 'stage']
            });
            console.log(`[DEBUG] 📝 Student has ${existingTasks.length} existing tasks`);
            const existingKeys = new Set(existingTasks.map(t => `${t.stage}-${t.title}`));
            const templatesToCreate = applicableTemplates.filter(tpl => !existingKeys.has(`${tpl.stage}-${tpl.title}`));
            console.log(`[DEBUG] 🆕 Will create ${templatesToCreate.length} new tasks for country '${countryId}'`);
            if (templatesToCreate.length > 0) {
                const newTasks = templatesToCreate.map(t => this.taskRepo.create({
                    companyId: student.companyId,
                    studentId: student.id,
                    stage: t.stage,
                    title: t.title,
                    description: t.description,
                    xpReward: t.xpReward,
                    status: enums_1.TaskStatus.TODO
                }));
                await this.taskRepo.save(newTasks);
                console.log(`[DEBUG] ✅ Created ${newTasks.length} tasks for country '${countryId}'`);
            }
            else {
                console.log(`[DEBUG] ℹ️ No new tasks for country '${countryId}' - already synced`);
            }
        }
        console.log(`[DEBUG] ✅ Sync complete for student ${student.fullName} across ${countryIds.length} countries`);
    }
    async syncTasksForUser(userId) {
        const student = await this.studentRepo.findOne({ where: { userId } });
        if (student) {
            await this.syncStudentTasks(student.id);
        }
    }
    async findAllForStudentEntity(studentId) {
        return this.taskRepo.find({
            where: { studentId },
            order: { id: 'ASC' }
        });
    }
    async downloadZip(userId) {
        const student = await this.studentRepo.findOne({ where: { userId } });
        if (!student)
            throw new common_1.NotFoundException("Student not found");
        const tasks = await this.taskRepo.find({
            where: { studentId: student.id, status: enums_1.TaskStatus.DONE }
        });
        const archive = (0, archiver_1.default)('zip', {
            zlib: { level: 9 }
        });
        for (const task of tasks) {
            if (!task.submission)
                continue;
            let fileUrl = null;
            if (typeof task.submission === 'string') {
                fileUrl = task.submission;
            }
            else if (typeof task.submission === 'object' && task.submission.url) {
                fileUrl = task.submission.url;
            }
            if (!fileUrl)
                continue;
            try {
                const urlObj = new URL(fileUrl);
                const pathParts = urlObj.pathname.split('/');
                const objectName = pathParts[pathParts.length - 1];
                let friendlyName = objectName;
                const match = objectName.match(/^\d+-(.+)$/);
                if (match) {
                    friendlyName = match[1];
                }
                const safeTitle = task.title.replace(/[^a-zA-Z0-9а-яА-Я ]/g, '_');
                const entryName = `${safeTitle}_${friendlyName}`;
                const stream = await this.filesService.getFileStream(objectName);
                archive.append(stream, { name: entryName });
            }
            catch (e) {
                console.error(`Failed to archive task ${task.id} file`, e);
            }
        }
        archive.finalize();
        return archive;
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_1.InjectRepository)(task_template_entity_1.TaskTemplate)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        files_service_1.FilesService])
], TasksService);
