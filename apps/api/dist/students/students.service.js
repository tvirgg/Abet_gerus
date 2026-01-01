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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_entity_1 = require("../entities/student.entity");
const tasks_service_1 = require("../tasks/tasks.service");
let StudentsService = class StudentsService {
    constructor(studentRepo, tasksService) {
        this.studentRepo = studentRepo;
        this.tasksService = tasksService;
    }
    async getStudent(id) {
        return this.studentRepo.findOne({ where: { id }, relations: ['user'] });
    }
    async updateProfile(id, data) {
        const student = await this.studentRepo.findOneBy({ id });
        if (!student)
            throw new common_1.NotFoundException('Student not found');
        let needsSync = false;
        if (data.fullName)
            student.fullName = data.fullName;
        if (data.countryId && data.countryId !== student.countryId) {
            student.countryId = data.countryId;
            needsSync = true;
        }
        if (data.selectedProgramIds) {
            student.selectedProgramIds = data.selectedProgramIds;
            needsSync = true;
        }
        const savedStudent = await this.studentRepo.save(student);
        if (needsSync) {
            await this.tasksService.syncStudentTasks(savedStudent.id);
        }
        return savedStudent;
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        tasks_service_1.TasksService])
], StudentsService);
