import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { CamundaService } from '../camunda/camunda.service';
import { JwtService } from '@nestjs/jwt';
import { TasksService } from '../tasks/tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { Company } from '../entities/company.entity';
import { DataSource } from 'typeorm';
import { Role } from '../entities/enums';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

// Mocks
const mockRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    save: jest.fn(),
  },
};

const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
};

const mockCamunda = {
  startProcessByKey: jest.fn(),
};

const mockTasksService = {
  syncTasksForUser: jest.fn(),
};

const mockJwt = {
  sign: jest.fn(() => 'mock_token'),
};

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let studentRepo: any;
  let companyRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: { ...mockRepo } },
        { provide: getRepositoryToken(Student), useValue: { ...mockRepo } },
        { provide: getRepositoryToken(Company), useValue: { ...mockRepo } },
        { provide: DataSource, useValue: mockDataSource },
        { provide: CamundaService, useValue: mockCamunda },
        { provide: JwtService, useValue: mockJwt },
        { provide: TasksService, useValue: mockTasksService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    studentRepo = module.get(getRepositoryToken(Student));
    companyRepo = module.get(getRepositoryToken(Company));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new student successfully', async () => {
      // Arrange
      const company = { id: 'comp-1' };
      companyRepo.findOne.mockResolvedValue(company);
      userRepo.findOne.mockResolvedValue(null); // User not exists

      // Mock Transaction
      const savedUser = { id: 'user-1', email: 'test@test.com', role: Role.STUDENT, companyId: 'comp-1' };
      mockQueryRunner.manager.save
        .mockResolvedValueOnce(savedUser) // Save User
        .mockResolvedValueOnce({ id: 'student-1' }); // Save Student

      mockCamunda.startProcessByKey.mockResolvedValue({ id: 'proc-1' });

      // Stub login
      jest.spyOn(service, 'login').mockResolvedValue({ accessToken: 'token', user: savedUser } as any);

      // Act
      const result = await service.register({
        email: 'test@test.com',
        password: '123',
        role: 'student',
      });

      // Assert
      expect(companyRepo.findOne).toHaveBeenCalled();
      expect(userRepo.findOne).toHaveBeenCalled();
      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(2); // User + Student
      expect(mockCamunda.startProcessByKey).toHaveBeenCalled();
      expect(studentRepo.update).toHaveBeenCalledWith({ userId: 'user-1' }, { camundaProcessInstanceId: 'proc-1' });
      expect(mockTasksService.syncTasksForUser).toHaveBeenCalledWith('user-1');
      expect(service.login).toHaveBeenCalled();
    });

    it('should throw if user already exists', async () => {
      companyRepo.findOne.mockResolvedValue({ id: 'comp-1' });
      userRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({ email: 'exist@test.com', password: '123' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should rollback transaction on error', async () => {
      companyRepo.findOne.mockResolvedValue({ id: 'comp-1' });
      userRepo.findOne.mockResolvedValue(null);

      mockQueryRunner.manager.save.mockRejectedValue(new Error('DB Error'));

      await expect(
        service.register({ email: 'fail@test.com', password: '123' })
      ).rejects.toThrow('DB Error');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      const user = {
        id: 'u-1',
        email: 'test@test.com',
        passwordHash: 'hashed_123', // Matches hashPassword('123') logic in service
        role: Role.STUDENT,
        companyId: 'c-1'
      };
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.login({ email: 'test@test.com', password: '123' });
      expect(result.accessToken).toBe('mock_token');
    });

    it('should throw Unauthorized for invalid password', async () => {
      const user = {
        id: 'u-1',
        email: 'test@test.com',
        passwordHash: 'hashed_123',
        role: Role.STUDENT
      };
      userRepo.findOne.mockResolvedValue(user);

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
