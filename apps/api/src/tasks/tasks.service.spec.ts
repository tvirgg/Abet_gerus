import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { Student } from '../entities/student.entity';
import { TaskTemplate } from '../entities/task-template.entity';
import { Program } from '../entities/program.entity';
import { FilesService } from '../files/files.service';
import { In, IsNull, Repository } from 'typeorm';
import { TaskStatus } from '../entities/enums';

describe('TasksService', () => {
    let service: TasksService;
    let taskRepo: Repository<Task>;
    let studentRepo: Repository<Student>;
    let templateRepo: Repository<TaskTemplate>;
    let programRepo: Repository<Program>;

    const mockTaskRepo = {
        find: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        findOneBy: jest.fn(),
    };

    const mockStudentRepo = {
        findOne: jest.fn(),
        save: jest.fn(),
        findOneBy: jest.fn(),
    };

    const mockTemplateRepo = {
        find: jest.fn(),
    };

    const mockProgramRepo = {
        find: jest.fn(),
    };

    const mockFilesService = {
        getFileStream: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TasksService,
                { provide: getRepositoryToken(Task), useValue: mockTaskRepo },
                { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
                { provide: getRepositoryToken(TaskTemplate), useValue: mockTemplateRepo },
                { provide: getRepositoryToken(Program), useValue: mockProgramRepo },
                { provide: FilesService, useValue: mockFilesService },
            ],
        }).compile();

        service = module.get<TasksService>(TasksService);
        taskRepo = module.get(getRepositoryToken(Task));
        studentRepo = module.get(getRepositoryToken(Student));
        templateRepo = module.get(getRepositoryToken(TaskTemplate));
        programRepo = module.get(getRepositoryToken(Program));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should sync tasks correctly with cascading logic', async () => {
        // Setup
        const studentId = 'student-1';
        const student = {
            id: studentId,
            countries: [{ id: 'at' }],
            selectedProgramIds: [100],
            companyId: 'company-1'
        };

        const programs = [{ id: 100, universityId: 'uni-1' }];

        // Templates
        const tplCountry = { countryId: 'at', title: 'Passport', stage: 'Docs', submissionType: 'file', xpReward: 10 };
        const tplUni = { universityId: 'uni-1', title: 'Register', stage: 'Uni', submissionType: 'link', xpReward: 20 };
        const tplProgram = { programId: 100, title: 'Exam', stage: 'Prog', submissionType: 'text', xpReward: 30 };

        mockStudentRepo.findOne.mockResolvedValue(student);
        mockProgramRepo.find.mockResolvedValue(programs);
        mockTemplateRepo.find.mockResolvedValue([tplCountry, tplUni, tplProgram]);
        mockTaskRepo.find.mockResolvedValue([]); // No existing tasks
        mockTaskRepo.create.mockImplementation((dto) => dto);
        mockTaskRepo.save.mockResolvedValue([]);

        // Execute
        await service.syncStudentTasks(studentId);

        // Verify
        expect(mockStudentRepo.findOne).toHaveBeenCalledWith({
            where: { id: studentId },
            relations: ['countries']
        });

        expect(mockProgramRepo.find).toHaveBeenCalledWith({
            where: { id: In([100]) },
            select: ['universityId']
        });

        // Check call to save (should create 3 tasks)
        expect(mockTaskRepo.save).toHaveBeenCalledTimes(1);
        const savedTasks = (mockTaskRepo.save as jest.Mock).mock.calls[0][0];
        expect(savedTasks).toHaveLength(3);

        // Verify content of saved tasks
        expect(savedTasks).toEqual(expect.arrayContaining([
            expect.objectContaining({ title: 'Passport', stage: 'Docs' }),
            expect.objectContaining({ title: 'Register', stage: 'Uni' }),
            expect.objectContaining({ title: 'Exam', stage: 'Prog' }),
        ]));
    });

    it('should deduplicate tasks favoring more specific one', async () => {
        // Scenario: "Passport" exists at Country level and Program level.
        // Program level should override.

        const studentId = 'student-2';
        const student = {
            id: studentId,
            countries: [{ id: 'at' }],
            selectedProgramIds: [100],
            companyId: 'company-1'
        };
        const programs = [{ id: 100, universityId: 'uni-1' }];

        mockStudentRepo.findOne.mockResolvedValue(student);
        mockProgramRepo.find.mockResolvedValue(programs);

        const tplCountry = { countryId: 'at', title: 'Passport', stage: 'Docs', xpReward: 10 };
        const tplProgram = { programId: 100, title: 'Passport', stage: 'Docs', xpReward: 50 }; // Specific override

        mockTemplateRepo.find.mockResolvedValue([tplCountry, tplProgram]);
        mockTaskRepo.find.mockResolvedValue([]);
        mockTaskRepo.create.mockImplementation(dto => dto);

        await service.syncStudentTasks(studentId);

        const savedTasks = (mockTaskRepo.save as jest.Mock).mock.calls[0][0];
        expect(savedTasks).toHaveLength(1);
        expect(savedTasks[0].xpReward).toBe(50); // Should pick the program one
    });
});
