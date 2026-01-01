
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { DocumentTemplate } from './document-template.entity';

export enum DocumentStatus {
    MISSING = 'MISSING',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

@Entity('student_documents')
export class StudentDocument {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    studentId!: string;

    @ManyToOne(() => Student, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'studentId' })
    student!: Student;

    @Column()
    templateId!: number;

    @ManyToOne(() => DocumentTemplate, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'templateId' })
    template!: DocumentTemplate;

    @Column('text', { nullable: true })
    minio_file_path?: string;

    @Column({
        type: 'enum',
        enum: DocumentStatus,
        default: DocumentStatus.MISSING,
    })
    status!: DocumentStatus;

    @Column('text', { nullable: true })
    manager_comment?: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
