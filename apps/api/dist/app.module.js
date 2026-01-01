"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const typeorm_1 = require("@nestjs/typeorm");
const camunda_module_1 = require("./camunda/camunda.module");
const auth_module_1 = require("./auth/auth.module");
const countries_module_1 = require("./countries/countries.module");
const tasks_module_1 = require("./tasks/tasks.module");
const admin_module_1 = require("./admin/admin.module");
const files_module_1 = require("./files/files.module");
const students_module_1 = require("./students/students.module");
const telegram_module_1 = require("./telegram/telegram.module");
const documents_module_1 = require("./documents/documents.module");
const company_entity_1 = require("./entities/company.entity");
const user_entity_1 = require("./entities/user.entity");
const student_entity_1 = require("./entities/student.entity");
const country_entity_1 = require("./entities/country.entity");
const task_entity_1 = require("./entities/task.entity");
const university_entity_1 = require("./entities/university.entity");
const program_entity_1 = require("./entities/program.entity");
const task_template_entity_1 = require("./entities/task-template.entity");
const curator_entity_1 = require("./entities/curator.entity");
const document_template_entity_1 = require("./entities/document-template.entity");
const student_document_entity_1 = require("./entities/student-document.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            axios_1.HttpModule,
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                url: process.env.DATABASE_URL,
                entities: [company_entity_1.Company, user_entity_1.User, student_entity_1.Student, country_entity_1.Country, task_entity_1.Task, university_entity_1.University, program_entity_1.Program, task_template_entity_1.TaskTemplate, curator_entity_1.Curator, document_template_entity_1.DocumentTemplate, student_document_entity_1.StudentDocument],
                synchronize: true,
                autoLoadEntities: true,
            }),
            camunda_module_1.CamundaModule,
            auth_module_1.AuthModule,
            countries_module_1.CountriesModule,
            tasks_module_1.TasksModule,
            admin_module_1.AdminModule,
            files_module_1.FilesModule,
            students_module_1.StudentsModule,
            telegram_module_1.TelegramModule,
            documents_module_1.DocumentsModule,
        ],
    })
], AppModule);
