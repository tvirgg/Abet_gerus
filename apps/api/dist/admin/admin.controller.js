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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    createCountry(dto) {
        return this.adminService.createCountry(dto);
    }
    updateCountry(id, dto) {
        return this.adminService.updateCountry(id, dto);
    }
    getUniversities() {
        return this.adminService.getUniversities();
    }
    createUniversity(dto) {
        return this.adminService.createUniversity(dto);
    }
    getTaskTemplates() {
        return this.adminService.getTaskTemplates();
    }
    createTaskTemplate(dto) {
        return this.adminService.createTaskTemplate(dto);
    }
    deleteTaskTemplate(id) {
        return this.adminService.deleteTaskTemplate(Number(id));
    }
    searchPrograms(countryId, universityId, category, search) {
        return this.adminService.searchPrograms({ countryId, universityId, category, search });
    }
    createProgram(dto) {
        return this.adminService.createProgram(dto);
    }
    updateProgram(id, dto) {
        return this.adminService.updateProgram(Number(id), dto);
    }
    deleteProgram(id) {
        return this.adminService.deleteProgram(Number(id));
    }
    getModerators() {
        return this.adminService.getModerators();
    }
    createModerator(dto) {
        return this.adminService.createModerator(dto);
    }
    updateModerator(id, dto) {
        return this.adminService.updateModerator(id, dto);
    }
    deleteModerator(id) {
        return this.adminService.deleteModerator(id);
    }
    getUnassignedStudents() {
        return this.adminService.getUnassignedStudents();
    }
    assignStudents(id, body) {
        return this.adminService.assignStudentsToCurator(id, body.studentIds);
    }
    getStudents() {
        return this.adminService.getStudents();
    }
    createStudent(dto) {
        return this.adminService.createStudent(dto);
    }
    updateStudent(id, body) {
        return this.adminService.updateStudentAdmin(id, body);
    }
    deleteStudent(id) {
        return this.adminService.deleteStudent(id);
    }
    resetPassword(id, password) {
        return this.adminService.resetPassword(id, password);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)("countries"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createCountry", null);
__decorate([
    (0, common_1.Patch)("countries/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateCountry", null);
__decorate([
    (0, common_1.Get)("universities"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUniversities", null);
__decorate([
    (0, common_1.Post)("universities"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createUniversity", null);
__decorate([
    (0, common_1.Get)("task-templates"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getTaskTemplates", null);
__decorate([
    (0, common_1.Post)("task-templates"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createTaskTemplate", null);
__decorate([
    (0, common_1.Delete)("task-templates/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteTaskTemplate", null);
__decorate([
    (0, common_1.Get)("programs/search"),
    __param(0, (0, common_1.Query)("countryId")),
    __param(1, (0, common_1.Query)("universityId")),
    __param(2, (0, common_1.Query)("category")),
    __param(3, (0, common_1.Query)("search")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "searchPrograms", null);
__decorate([
    (0, common_1.Post)("programs"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createProgram", null);
__decorate([
    (0, common_1.Patch)("programs/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateProgram", null);
__decorate([
    (0, common_1.Delete)("programs/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteProgram", null);
__decorate([
    (0, common_1.Get)("moderators"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getModerators", null);
__decorate([
    (0, common_1.Post)("moderators"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createModerator", null);
__decorate([
    (0, common_1.Patch)("moderators/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateModerator", null);
__decorate([
    (0, common_1.Delete)("moderators/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteModerator", null);
__decorate([
    (0, common_1.Get)("students/unassigned"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUnassignedStudents", null);
__decorate([
    (0, common_1.Post)("moderators/:id/assign-students"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "assignStudents", null);
__decorate([
    (0, common_1.Get)("students"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getStudents", null);
__decorate([
    (0, common_1.Post)("students"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createStudent", null);
__decorate([
    (0, common_1.Patch)("students/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateStudent", null);
__decorate([
    (0, common_1.Delete)("students/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteStudent", null);
__decorate([
    (0, common_1.Patch)("users/:id/reset-password"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)("password")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "resetPassword", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)("admin"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
