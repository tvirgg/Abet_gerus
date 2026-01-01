
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentTemplate } from '../entities/document-template.entity';
import { StudentDocument, DocumentStatus } from '../entities/student-document.entity';
import { FilesService } from '../files/files.service';
import { Student } from '../entities/student.entity';
import { CamundaService } from '../camunda/camunda.service';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class DocumentsService {
    constructor(
        @InjectRepository(DocumentTemplate)
        private templateRepo: Repository<DocumentTemplate>,
        @InjectRepository(StudentDocument)
        private docRepo: Repository<StudentDocument>,
        @InjectRepository(Student)
        private studentRepo: Repository<Student>,
        private filesService: FilesService,
        private camundaService: CamundaService,
    ) { }

    async getRequirements(userId: string) {
        // 1. Get student by userId
        const student = await this.studentRepo.findOne({ where: { userId } });
        if (!student) {
            throw new NotFoundException('Student profile not found');
        }

        // 2. Get all templates
        const templates = await this.templateRepo.find({
            order: { step_order: 'ASC', id: 'ASC' },
        });

        // 3. Get existing documents for this student
        const existingDocs = await this.docRepo.find({
            where: { studentId: student.id },
        });

        // 4. Merge info
        const requirements = templates.map((tmpl) => {
            const doc = existingDocs.find((d) => d.templateId === tmpl.id);
            return {
                ...tmpl,
                studentDocument: doc || null,
                status: doc ? doc.status : DocumentStatus.MISSING,
            };
        });

        return requirements;
    }

    async uploadDocument(userId: string, templateId: number, file: Express.Multer.File) {
        // 1. Get student
        const student = await this.studentRepo.findOne({ where: { userId } });
        if (!student) {
            throw new NotFoundException('Student profile not found');
        }

        // 2. Validate template
        const template = await this.templateRepo.findOne({ where: { id: templateId } });
        if (!template) {
            throw new NotFoundException('Template not found');
        }

        // 3. Upload file
        const fileUrl = await this.filesService.uploadFile(file);

        // 4. Update or Create StudentDocument
        let doc = await this.docRepo.findOne({
            where: { studentId: student.id, templateId: templateId },
        });

        if (doc) {
            doc.minio_file_path = fileUrl;
            doc.status = DocumentStatus.PENDING;
            doc.manager_comment = undefined; // Clear previous rejections if any
        } else {
            doc = this.docRepo.create({
                studentId: student.id,
                templateId: templateId,
                minio_file_path: fileUrl,
                status: DocumentStatus.PENDING,
            });
        }

        return await this.docRepo.save(doc);
    }
    async reviewDocument(documentId: string, status: DocumentStatus, comment?: string) {
        // 1. Find document
        const doc = await this.docRepo.findOne({
            where: { id: documentId },
            relations: ['student', 'template'],
        });

        if (!doc) {
            throw new NotFoundException('Document not found');
        }

        // 2. Validate and Update
        if (status === DocumentStatus.REJECTED && !comment) {
            throw new BadRequestException('Comment is required when rejecting a document');
        }

        doc.status = status;
        if (comment) {
            doc.manager_comment = comment;
        }

        const savedDoc = await this.docRepo.save(doc);

        // 3. Send message to Camunda
        // Message name convention: "DocumentReviewed"
        // Correlate by studentId (Business Key)
        if (this.camundaService) {
            await this.camundaService.sendMessage(
                'DocumentReviewed',
                doc.studentId, // Business Key
                {
                    documentId: doc.id,
                    templateId: doc.templateId,
                    status: status,
                    comment: comment || '',
                }
            );
        }

        return savedDoc;
    }

    async getPendingDocuments() {
        return await this.docRepo.find({
            where: { status: DocumentStatus.PENDING },
            relations: ['student', 'student.user', 'template'],
            order: { created_at: 'ASC' },
        });
    }
}
