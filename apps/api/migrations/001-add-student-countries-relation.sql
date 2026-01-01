-- Migration: AddStudentCountriesRelation
-- Created: 2026-01-02
-- Description: Adds many-to-many relationship between students and countries

-- Create join table for student-countries relationship
CREATE TABLE IF NOT EXISTS student_countries (
    "studentId" uuid NOT NULL,
    "countryId" varchar NOT NULL,
    PRIMARY KEY ("studentId", "countryId"),
    CONSTRAINT "FK_student_countries_student" 
        FOREIGN KEY ("studentId") 
        REFERENCES students(id) 
        ON DELETE CASCADE,
    CONSTRAINT "FK_student_countries_country" 
        FOREIGN KEY ("countryId") 
        REFERENCES countries(id) 
        ON DELETE CASCADE
);

-- Migrate existing data: copy countryId to countries relationship
INSERT INTO student_countries ("studentId", "countryId")
SELECT id, "countryId"
FROM students
WHERE "countryId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "IDX_student_countries_student" ON student_countries("studentId");
CREATE INDEX IF NOT EXISTS "IDX_student_countries_country" ON student_countries("countryId");

-- NOTE: We keep the legacy countryId column for backward compatibility
-- It can be removed in a future migration after full transition
