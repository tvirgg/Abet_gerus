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
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const document_template_entity_1 = require("../entities/document-template.entity");
const student_document_entity_1 = require("../entities/student-document.entity");
const files_service_1 = require("../files/files.service");
const student_entity_1 = require("../entities/student.entity");
const camunda_service_1 = require("../camunda/camunda.service");
const common_2 = require("@nestjs/common");
let DocumentsService = class DocumentsService {
    constructor(templateRepo, docRepo, studentRepo, filesService, camundaService) {
        this.templateRepo = templateRepo;
        this.docRepo = docRepo;
        this.studentRepo = studentRepo;
        this.filesService = filesService;
        this.camundaService = camundaService;
    }
    async getRequirements(userId) {
        const student = await this.studentRepo.findOne({ where: { userId } });
        if (!student) {
            throw new common_1.NotFoundException('Student profile not found');
        }
        const templates = await this.templateRepo.find({
            order: { step_order: 'ASC', id: 'ASC' },
        });
        const existingDocs = await this.docRepo.find({
            where: { studentId: student.id },
        });
        const requirements = templates.map((tmpl) => {
            const doc = existingDocs.find((d) => d.templateId === tmpl.id);
            return {
                ...tmpl,
                studentDocument: doc || null,
                status: doc ? doc.status : student_document_entity_1.DocumentStatus.MISSING,
            };
        });
        return requirements;
    }
    async uploadDocument(userId, templateId, file) {
        const student = await this.studentRepo.findOne({ where: { userId } });
        if (!student) {
            throw new common_1.NotFoundException('Student profile not found');
        }
        const template = await this.templateRepo.findOne({ where: { id: templateId } });
        if (!template) {
            throw new common_1.NotFoundException('Template not found');
        }
        const fileUrl = await this.filesService.uploadFile(file);
        let doc = await this.docRepo.findOne({
            where: { studentId: student.id, templateId: templateId },
        });
        if (doc) {
            doc.minio_file_path = fileUrl;
            doc.status = student_document_entity_1.DocumentStatus.PENDING;
            doc.manager_comment = undefined;
        }
        else {
            doc = this.docRepo.create({
                studentId: student.id,
                templateId: templateId,
                minio_file_path: fileUrl,
                status: student_document_entity_1.DocumentStatus.PENDING,
            });
        }
        return await this.docRepo.save(doc);
    }
    async reviewDocument(documentId, status, comment) {
        const doc = await this.docRepo.findOne({
            where: { id: documentId },
            relations: ['student', 'template'],
        });
        if (!doc) {
            throw new common_1.NotFoundException('Document not found');
        }
        if (status === student_document_entity_1.DocumentStatus.REJECTED && !comment) {
            throw new common_2.BadRequestException('Comment is required when rejecting a document');
        }
        doc.status = status;
        if (comment) {
            doc.manager_comment = comment;
        }
        const savedDoc = await this.docRepo.save(doc);
        if (this.camundaService) {
            await this.camundaService.sendMessage('DocumentReviewed', doc.studentId, {
                documentId: doc.id,
                templateId: doc.templateId,
                status: status,
                comment: comment || '',
            });
        }
        return savedDoc;
    }
    async getPendingDocuments() {
        return await this.docRepo.find({
            where: { status: student_document_entity_1.DocumentStatus.PENDING },
            relations: ['student', 'student.user', 'template'],
            order: { created_at: 'ASC' },
        });
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(document_template_entity_1.DocumentTemplate)),
    __param(1, (0, typeorm_1.InjectRepository)(student_document_entity_1.StudentDocument)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        files_service_1.FilesService,
        camunda_service_1.CamundaService])
], DocumentsService);
