"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const country_entity_1 = require("../entities/country.entity");
const university_entity_1 = require("../entities/university.entity");
const program_entity_1 = require("../entities/program.entity");
const task_template_entity_1 = require("../entities/task-template.entity");
const user_entity_1 = require("../entities/user.entity");
const student_entity_1 = require("../entities/student.entity");
const company_entity_1 = require("../entities/company.entity");
const curator_entity_1 = require("../entities/curator.entity");
const tasks_module_1 = require("../tasks/tasks.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                country_entity_1.Country,
                university_entity_1.University,
                program_entity_1.Program,
                task_template_entity_1.TaskTemplate,
                user_entity_1.User,
                student_entity_1.Student,
                company_entity_1.Company,
                curator_entity_1.Curator
            ]),
            tasks_module_1.TasksModule
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService],
    })
], AdminModule);
