import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { CamundaService } from '../camunda/camunda.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { TasksService } from '../tasks/tasks.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock Prisma
const mockPrisma: any = {
  company: { findFirst: jest.fn() },
  user: { findFirst: jest.fn(), create: jest.fn() },
  student: { create: jest.fn(), update: jest.fn() },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

// Mock Camunda
const mockCamunda = {
  startProcessByKey: jest.fn(() => Promise.resolve({ id: 'process-123' })),
};

// Mock TasksService
const mockTasksService = {
  generateInitialTasks: jest.fn(),
};

// MOCK PRISMA CLIENT MODULE
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
    Role: { STUDENT: 'STUDENT', CURATOR: 'CURATOR', ADMIN: 'ADMIN' }
  };
});

// Mock JWT
const mockJwt = {
  sign: jest.fn(() => 'mock_token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CamundaService, useValue: mockCamunda },
        { provide: JwtService, useValue: mockJwt },
        { provide: TasksService, useValue: mockTasksService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new student', async () => {
      // Arrange
      mockPrisma.company.findFirst.mockResolvedValue({ id: 'comp-1' });
      
      // 1-й вызов (проверка существования) -> null
      // 2-й вызов (логин после регистрации) -> user с хешем
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'user-1', role: 'STUDENT', email: 'test@test.com', passwordHash: 'hashed_123', companyId: 'comp-1' });

      mockPrisma.user.create.mockResolvedValue({ id: 'user-1', role: 'STUDENT', email: 'test@test.com', passwordHash: 'hashed_123' });
      mockPrisma.student.create.mockResolvedValue({ id: 'stud-1' });
      
      // Act
      const result = await service.register({
        email: 'test@test.com',
        password: '123',
        role: 'student'
      });

      // Assert
      expect(mockCamunda.startProcessByKey).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result.user.role).toBe('STUDENT');
    });

    it('should throw if user exists', async () => {
      mockPrisma.company.findFirst.mockResolvedValue({ id: 'comp-1' });
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({ email: 'exist@test.com', password: '123' })
      ).rejects.toThrow();
    });
  });
});
