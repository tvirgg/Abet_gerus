import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentTemplate, DocumentType } from '../entities/document-template.entity';
import { StudentDocument, DocumentStatus } from '../entities/student-document.entity';
import { Student } from '../entities/student.entity';
import { FilesService } from '../files/files.service';
import { CamundaService } from '../camunda/camunda.service';
import { NotFoundException } from '@nestjs/common';

// Mock Repositories
const mockTemplateRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
};

const mockDocRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
};

const mockStudentRepo = {
    findOne: jest.fn(),
};

const mockFilesService = {
    uploadFile: jest.fn(),
};

const mockCamundaService = {
    sendMessage: jest.fn(),
};

describe('DocumentsService', () => {
    let service: DocumentsService;
    let templateRepo: Repository<DocumentTemplate>;
    let docRepo: Repository<StudentDocument>;
    let studentRepo: Repository<Student>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DocumentsService,
                { provide: getRepositoryToken(DocumentTemplate), useValue: mockTemplateRepo },
                { provide: getRepositoryToken(StudentDocument), useValue: mockDocRepo },
                { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
                { provide: FilesService, useValue: mockFilesService },
                { provide: CamundaService, useValue: mockCamundaService },
            ],
        }).compile();

        service = module.get<DocumentsService>(DocumentsService);
        templateRepo = module.get(getRepositoryToken(DocumentTemplate));
        docRepo = module.get(getRepositoryToken(StudentDocument));
        studentRepo = module.get(getRepositoryToken(Student));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getRequirements', () => {
        const mockStudent = {
            id: 'student-1',
            userId: 'user-1',
            fullName: 'Test Student',
            countries: [],
        };

        const mockPassportTemplate = {
            id: 1,
            document_type: DocumentType.PASSPORT,
            step_order: 1,
            title: 'Passport',
            description: 'Upload your passport',
        };

        const mockDiplomaTemplate = {
            id: 2,
            document_type: DocumentType.EDUCATION,
            step_order: 2,
            title: 'Diploma',
            description: 'Upload your diploma',
        };

        it('should deduplicate Passport for multi-country student', async () => {
            // Arrange
            const student = {
                ...mockStudent,
                countries: [
                    { id: 'at', name: 'Austria' },
                    { id: 'de', name: 'Germany' },
                ],
            };

            // Passport already uploaded (PENDING)
            const existingPassport = {
                id: 'doc-1',
                studentId: student.id,
                templateId: 1,
                status: DocumentStatus.PENDING,
            };

            mockStudentRepo.findOne.mockResolvedValue(student);
            mockTemplateRepo.find.mockResolvedValue([mockPassportTemplate, mockDiplomaTemplate]);
            mockDocRepo.find.mockResolvedValue([existingPassport]);

            // Act
            const requirements = await service.getRequirements('user-1');

            // Assert
            const passportRequirement = requirements.find((r) => r.document_type === DocumentType.PASSPORT);
            expect(passportRequirement).toBeUndefined(); // Passport should be filtered out

            const diplomaRequirement = requirements.find((r) => r.document_type === DocumentType.EDUCATION);
            expect(diplomaRequirement).toBeDefined(); // Diploma should still be there
        });

        it('should exclude already uploaded Passport', async () => {
            // Arrange
            const student = {
                ...mockStudent,
                countries: [{ id: 'at', name: 'Austria' }],
            };

            // Passport already APPROVED
            const approvedPassport = {
                id: 'doc-1',
                studentId: student.id,
                templateId: 1,
                status: DocumentStatus.APPROVED,
            };

            mockStudentRepo.findOne.mockResolvedValue(student);
            mockTemplateRepo.find.mockResolvedValue([mockPassportTemplate, mockDiplomaTemplate]);
            mockDocRepo.find.mockResolvedValue([approvedPassport]);

            // Act
            const requirements = await service.getRequirements('user-1');

            // Assert
            const passportRequirement = requirements.find((r) => r.document_type === DocumentType.PASSPORT);
            expect(passportRequirement).toBeUndefined(); // Should be excluded

            expect(requirements).toHaveLength(1); // Only Diploma
            expect(requirements[0].document_type).toBe(DocumentType.EDUCATION);
        });

        it('should show country-specific documents for each country', async () => {
            // Arrange
            const student = {
                ...mockStudent,
                countries: [
                    { id: 'at', name: 'Austria' },
                    { id: 'de', name: 'Germany' },
                ],
            };

            const certificateAtTemplate = {
                id: 3,
                document_type: DocumentType.EDUCATION,
                countryId: 'at',
                step_order: 3,
                title: 'Austrian Certificate',
            };

            const certificateDeTemplate = {
                id: 4,
                document_type: DocumentType.EDUCATION,
                countryId: 'de',
                step_order: 4,
                title: 'German Certificate',
            };

            mockStudentRepo.findOne.mockResolvedValue(student);
            mockTemplateRepo.find.mockResolvedValue([
                mockPassportTemplate,
                certificateAtTemplate,
                certificateDeTemplate,
            ]);
            mockDocRepo.find.mockResolvedValue([]);

            // Act
            const requirements = await service.getRequirements('user-1');

            // Assert
            expect(requirements).toHaveLength(3); // Passport + 2 certificates
            expect(requirements.find((r) => r.id === 1)).toBeDefined(); // Passport
            expect(requirements.find((r) => r.id === 3)).toBeDefined(); // AT Certificate
            expect(requirements.find((r) => r.id === 4)).toBeDefined(); // DE Certificate
        });

        it('should handle student with no countries', async () => {
            // Arrange
            const student = {
                ...mockStudent,
                countries: [],
            };

            mockStudentRepo.findOne.mockResolvedValue(student);
            mockTemplateRepo.find.mockResolvedValue([mockPassportTemplate, mockDiplomaTemplate]);
            mockDocRepo.find.mockResolvedValue([]);

            // Act
            const requirements = await service.getRequirements('user-1');

            // Assert
            expect(requirements).toHaveLength(2); // All templates shown
            expect(requirements.find((r) => r.id === 1)).toBeDefined();
            expect(requirements.find((r) => r.id === 2)).toBeDefined();
        });

        it('should throw NotFoundException if student not found', async () => {
            // Arrange
            mockStudentRepo.findOne.mockResolvedValue(null);

            // Act & Assert
            await expect(service.getRequirements('non-existent-user')).rejects.toThrow(
                NotFoundException
            );
            await expect(service.getRequirements('non-existent-user')).rejects.toThrow(
                'Student profile not found'
            );
        });

        it('should show rejected documents as MISSING (can re-upload)', async () => {
            // Arrange
            const student = {
                ...mockStudent,
                countries: [{ id: 'at', name: 'Austria' }],
            };

            // Passport REJECTED - should still show up so student can re-upload
            const rejectedPassport = {
                id: 'doc-1',
                studentId: student.id,
                templateId: 1,
                status: DocumentStatus.REJECTED,
            };

            mockStudentRepo.findOne.mockResolvedValue(student);
            mockTemplateRepo.find.mockResolvedValue([mockPassportTemplate]);
            mockDocRepo.find.mockResolvedValue([rejectedPassport]);

            // Act
            const requirements = await service.getRequirements('user-1');

            // Assert
            const passportRequirement = requirements.find((r) => r.document_type === DocumentType.PASSPORT);
            expect(passportRequirement).toBeDefined(); // Should still show
            expect(passportRequirement?.status).toBe(DocumentStatus.REJECTED);
            expect(passportRequirement?.studentDocument).toBeDefined();
            expect(passportRequirement?.studentDocument?.id).toBe('doc-1');
        });

        it('should preserve document status and reference', async () => {
            // Arrange
            const student = {
                ...mockStudent,
                countries: [{ id: 'at', name: 'Austria' }],
            };

            const pendingDiploma = {
                id: 'doc-2',
                studentId: student.id,
                templateId: 2,
                status: DocumentStatus.PENDING,
                minio_file_path: '/files/diploma.pdf',
            };

            mockStudentRepo.findOne.mockResolvedValue(student);
            mockTemplateRepo.find.mockResolvedValue([mockPassportTemplate, mockDiplomaTemplate]);
            mockDocRepo.find.mockResolvedValue([pendingDiploma]);

            // Act
            const requirements = await service.getRequirements('user-1');

            // Assert
            const diplomaRequirement = requirements.find((r) => r.id === 2);
            expect(diplomaRequirement).toBeDefined();
            expect(diplomaRequirement?.status).toBe(DocumentStatus.PENDING);
            expect(diplomaRequirement?.studentDocument).toBeDefined();
            expect(diplomaRequirement?.studentDocument?.minio_file_path).toBe('/files/diploma.pdf');
        });

        it('should set status to MISSING for templates without documents', async () => {
            // Arrange
            const student = {
                ...mockStudent,
                countries: [{ id: 'at', name: 'Austria' }],
            };

            mockStudentRepo.findOne.mockResolvedValue(student);
            mockTemplateRepo.find.mockResolvedValue([mockPassportTemplate, mockDiplomaTemplate]);
            mockDocRepo.find.mockResolvedValue([]); // No documents uploaded

            // Act
            const requirements = await service.getRequirements('user-1');

            // Assert
            expect(requirements).toHaveLength(2);
            expect(requirements[0].status).toBe(DocumentStatus.MISSING);
            expect(requirements[0].studentDocument).toBeNull();
            expect(requirements[1].status).toBe(DocumentStatus.MISSING);
            expect(requirements[1].studentDocument).toBeNull();
        });
    });
});
