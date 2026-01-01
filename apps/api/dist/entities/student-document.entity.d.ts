import { Student } from './student.entity';
import { DocumentTemplate } from './document-template.entity';
export declare enum DocumentStatus {
    MISSING = "MISSING",
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare class StudentDocument {
    id: string;
    studentId: string;
    student: Student;
    templateId: number;
    template: DocumentTemplate;
    minio_file_path?: string;
    status: DocumentStatus;
    manager_comment?: string;
    created_at: Date;
    updated_at: Date;
}
