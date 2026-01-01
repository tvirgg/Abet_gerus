
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum DocumentType {
    PASSPORT = 'passport',
    EDUCATION = 'education',
    TRANSLATION = 'translation',
    OTHER = 'other',
}

@Entity('document_templates')
export class DocumentTemplate {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column()
    title!: string;

    @Column('int')
    step_order!: number;

    @Column({
        type: 'enum',
        enum: DocumentType,
        default: DocumentType.OTHER,
    })
    document_type!: DocumentType;

    @Column('text', { nullable: true })
    advice_text?: string;

    @Column('jsonb', { nullable: true, default: [] })
    rejection_reasons?: string[];

    @Column('jsonb', { nullable: true, default: [] })
    validation_rules?: string[]; // e.g., ["Must have apostille", "Date visible"]

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
