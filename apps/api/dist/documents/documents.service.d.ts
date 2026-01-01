import { Repository } from 'typeorm';
import { DocumentTemplate } from '../entities/document-template.entity';
import { StudentDocument, DocumentStatus } from '../entities/student-document.entity';
import { FilesService } from '../files/files.service';
import { Student } from '../entities/student.entity';
import { CamundaService } from '../camunda/camunda.service';
export declare class DocumentsService {
    private templateRepo;
    private docRepo;
    private studentRepo;
    private filesService;
    private camundaService;
    constructor(templateRepo: Repository<DocumentTemplate>, docRepo: Repository<StudentDocument>, studentRepo: Repository<Student>, filesService: FilesService, camundaService: CamundaService);
    getRequirements(userId: string): Promise<{
        studentDocument: StudentDocument | null;
        status: DocumentStatus;
        id: number;
        title: string;
        step_order: number;
        document_type: import("../entities/document-template.entity").DocumentType;
        advice_text?: string;
        rejection_reasons?: string[];
        validation_rules?: string[];
        created_at: Date;
        updated_at: Date;
    }[]>;
    uploadDocument(userId: string, templateId: number, file: Express.Multer.File): Promise<StudentDocument>;
    reviewDocument(documentId: string, status: DocumentStatus, comment?: string): Promise<StudentDocument>;
    getPendingDocuments(): Promise<StudentDocument[]>;
}
