import { DocumentsService } from './documents.service';
import { DocumentStatus } from '../entities/student-document.entity';
export declare class DocumentsController {
    private readonly documentsService;
    constructor(documentsService: DocumentsService);
    getRequirements(req: any): Promise<{
        studentDocument: import("../entities/student-document.entity").StudentDocument | null;
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
    uploadDocument(req: any, file: Express.Multer.File, templateIdStr: string): Promise<import("../entities/student-document.entity").StudentDocument>;
    getPendingDocuments(req: any): Promise<import("../entities/student-document.entity").StudentDocument[]>;
    reviewDocument(documentId: string, body: {
        status: DocumentStatus;
        comment?: string;
    }): Promise<import("../entities/student-document.entity").StudentDocument>;
}
