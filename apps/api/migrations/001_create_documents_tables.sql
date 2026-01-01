-- Migration: Create document_templates and student_documents tables

-- 1. Create document_templates table
CREATE TABLE IF NOT EXISTS "document_templates" (
    "id" SERIAL NOT NULL,
    "title" character varying NOT NULL,
    "step_order" integer NOT NULL,
    "document_type" character varying NOT NULL DEFAULT 'other',
    "advice_text" text,
    "rejection_reasons" jsonb DEFAULT '[]',
    "validation_rules" jsonb DEFAULT '[]',
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_document_templates" PRIMARY KEY ("id")
);

-- 2. Create student_documents table
CREATE TABLE IF NOT EXISTS "student_documents" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "studentId" uuid NOT NULL,
    "templateId" integer NOT NULL,
    "minio_file_path" text,
    "status" character varying NOT NULL DEFAULT 'MISSING',
    "manager_comment" text,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_student_documents" PRIMARY KEY ("id")
);

-- 3. Add foreign keys
ALTER TABLE "student_documents" 
    ADD CONSTRAINT "FK_student_documents_studentId" 
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE;

ALTER TABLE "student_documents" 
    ADD CONSTRAINT "FK_student_documents_templateId" 
    FOREIGN KEY ("templateId") REFERENCES "document_templates"("id") ON DELETE CASCADE;
