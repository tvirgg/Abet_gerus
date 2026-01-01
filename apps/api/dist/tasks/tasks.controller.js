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
exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const tasks_service_1 = require("./tasks.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const submit_task_dto_1 = require("./dto/submit-task.dto");
const approve_task_dto_1 = require("./dto/approve-task.dto");
let TasksController = class TasksController {
    constructor(tasksService) {
        this.tasksService = tasksService;
    }
    getMyTasks(req) {
        return this.tasksService.findAllForUser(req.user.userId);
    }
    submitTask(id, body) {
        return this.tasksService.submitTask(id, body.submission);
    }
    getReviewQueue(req) {
        return this.tasksService.getReviewQueue();
    }
    approveTask(id) {
        return this.tasksService.approveTask(id);
    }
    requestChanges(id, body) {
        return this.tasksService.requestChanges(id, body.comment);
    }
    getStudentTasks(studentId) {
        return this.tasksService.findAllForStudentEntity(studentId);
    }
    generate(req) {
        return this.tasksService.syncTasksForUser(req.user.userId);
    }
    async downloadZip(req, res) {
        const archive = await this.tasksService.downloadZip(req.user.userId);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="documents.zip"');
        archive.pipe(res);
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, common_1.Get)("student/tasks"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "getMyTasks", null);
__decorate([
    (0, common_1.Post)("student/tasks/:id/submit"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submit_task_dto_1.SubmitTaskDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "submitTask", null);
__decorate([
    (0, common_1.Get)("curator/review"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "getReviewQueue", null);
__decorate([
    (0, common_1.Post)("curator/tasks/:id/approve"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "approveTask", null);
__decorate([
    (0, common_1.Post)("curator/tasks/:id/request-changes"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approve_task_dto_1.RejectTaskDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "requestChanges", null);
__decorate([
    (0, common_1.Get)("curator/students/:studentId/tasks"),
    __param(0, (0, common_1.Param)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "getStudentTasks", null);
__decorate([
    (0, common_1.Post)("debug/generate"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)("download-zip"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "downloadZip", null);
exports.TasksController = TasksController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], TasksController);
