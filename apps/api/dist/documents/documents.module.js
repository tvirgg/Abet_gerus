"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const documents_service_1 = require("./documents.service");
const documents_controller_1 = require("./documents.controller");
const document_template_entity_1 = require("../entities/document-template.entity");
const student_document_entity_1 = require("../entities/student-document.entity");
const student_entity_1 = require("../entities/student.entity");
const files_module_1 = require("../files/files.module");
const camunda_module_1 = require("../camunda/camunda.module");
let DocumentsModule = class DocumentsModule {
};
exports.DocumentsModule = DocumentsModule;
exports.DocumentsModule = DocumentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([document_template_entity_1.DocumentTemplate, student_document_entity_1.StudentDocument, student_entity_1.Student]),
            files_module_1.FilesModule,
            camunda_module_1.CamundaModule,
        ],
        controllers: [documents_controller_1.DocumentsController],
        providers: [documents_service_1.DocumentsService],
    })
], DocumentsModule);
