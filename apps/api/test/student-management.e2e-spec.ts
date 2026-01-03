import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Student } from '../src/entities/student.entity';
import { User } from '../src/entities/user.entity';
import { Country } from '../src/entities/country.entity';
import { Task } from '../src/entities/task.entity';
import { TaskStatus } from '../src/entities/enums';

describe('Student Management (e2e)', () => {
    let app: INestApplication;
    let studentRepo: any;
    let userRepo: any;
    let countryRepo: any;
    let taskRepo: any;
    let adminToken: string;
    let createdStudentId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api'); // Match production config
        await app.init();

        // Get repositories
        studentRepo = moduleFixture.get(getRepositoryToken(Student));
        userRepo = moduleFixture.get(getRepositoryToken(User));
        countryRepo = moduleFixture.get(getRepositoryToken(Country));
        taskRepo = moduleFixture.get(getRepositoryToken(Task));

        // Create admin user and login to get token
        const adminUser = await userRepo.findOne({ where: { role: 'ADMIN' } });
        console.log('[E2E] Admin user search result:', adminUser ? `Found: ${adminUser.email}` : 'Not found');

        if (!adminUser) {
            // If no admin exists, create one through the auth endpoint
            console.log('[E2E] Creating new admin user...');
            const registerResponse = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'admin@test.com',
                    password: 'admin123',
                    role: 'ADMIN',
                });

            console.log('[E2E] Register response status:', registerResponse.status);
            if (registerResponse.status === 201 || registerResponse.status === 200) {
                adminToken = registerResponse.body.accessToken;
                console.log('[E2E] Admin token from registration:', adminToken ? 'Received' : 'Missing');
            }
        } else {
            console.log('[E2E] Logging in as existing admin:', adminUser.email);
            const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: adminUser.email,
                    password: 'admin123', // Admin password
                });

            console.log('[E2E] Login response status:', loginResponse.status);
            if (loginResponse.status === 200 || loginResponse.status === 201) {
                adminToken = loginResponse.body.accessToken;
                console.log('[E2E] Admin token from login:', adminToken ? 'Received' : 'Missing');
            } else {
                console.error('[E2E] Login failed:', loginResponse.body);
            }
        }

        if (!adminToken) {
            throw new Error('Failed to obtain admin token for E2E tests');
        }
    });

    afterAll(async () => {
        // Cleanup: delete created test student
        if (createdStudentId) {
            const student = await studentRepo.findOne({
                where: { id: createdStudentId },
                relations: ['user']
            });
            if (student) {
                await studentRepo.delete(createdStudentId);
                if (student.user) {
                    await userRepo.delete(student.user.id);
                }
            }
        }
        await app.close();
    });

    describe('POST /api/admin/students - Create with multiple countries', () => {
        it('should create a student with multiple countries', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/admin/students')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'student-multi@test.com',
                    fullName: 'Multi Country Student',
                    countryIds: ['at', 'it'], // Austria and Italy
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.fullName).toBe('Multi Country Student');

            createdStudentId = response.body.id;

            // Verify countries are set in database
            const student = await studentRepo.findOne({
                where: { id: createdStudentId },
                relations: ['countries'],
            });

            expect(student.countries).toHaveLength(2);
            expect(student.countries.map((c: any) => c.id)).toEqual(
                expect.arrayContaining(['at', 'it'])
            );
        });

        it('should validate country IDs', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/admin/students')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'student-invalid@test.com',
                    fullName: 'Invalid Country Student',
                    countryIds: ['invalid-id', 'another-invalid'],
                })
                .expect(400);

            expect(response.body.message).toContain('invalid');
        });

        it('should sync tasks when creating student with countries', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/admin/students')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'student-tasks@test.com',
                    fullName: 'Task Sync Student',
                    countryIds: ['at'],
                })
                .expect(201);

            const studentId = response.body.id;

            // Wait a bit for task sync to complete
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verify tasks were created
            const tasks = await taskRepo.find({
                where: { studentId },
            });

            expect(tasks.length).toBeGreaterThan(0);

            // Cleanup
            await studentRepo.delete(studentId);
            const user = await userRepo.findOne({ where: { email: 'student-tasks@test.com' } });
            if (user) await userRepo.delete(user.id);
        });
    });

    describe('PATCH /api/admin/students/:id - Update countries', () => {
        let testStudentId: string;

        beforeEach(async () => {
            // Create a test student
            const response = await request(app.getHttpServer())
                .post('/api/admin/students')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: `student-update-${Date.now()}@test.com`,
                    fullName: 'Update Test Student',
                    countryIds: ['at'],
                });

            testStudentId = response.body.id;
        });

        afterEach(async () => {
            // Cleanup
            if (testStudentId) {
                const student = await studentRepo.findOne({
                    where: { id: testStudentId },
                    relations: ['user'],
                });
                if (student) {
                    await studentRepo.delete(testStudentId);
                    if (student.user) {
                        await userRepo.delete(student.user.id);
                    }
                }
            }
        });

        it('should add a country to existing student', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/admin/students/${testStudentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    countryIds: ['at', 'it'], // Add Italy
                })
                .expect(200);

            // Verify countries in database
            const student = await studentRepo.findOne({
                where: { id: testStudentId },
                relations: ['countries'],
            });

            expect(student.countries).toHaveLength(2);
            expect(student.countries.map((c: any) => c.id)).toEqual(
                expect.arrayContaining(['at', 'it'])
            );
        });

        it('should remove a country from student', async () => {
            // First add multiple countries
            await request(app.getHttpServer())
                .patch(`/api/admin/students/${testStudentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    countryIds: ['at', 'it'], // Austria, Italy
                })
                .expect(200);

            // Then remove one
            await request(app.getHttpServer())
                .patch(`/api/admin/students/${testStudentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    countryIds: ['at'], // Remove Italy
                })
                .expect(200);

            // Verify
            const student = await studentRepo.findOne({
                where: { id: testStudentId },
                relations: ['countries'],
            });

            expect(student.countries).toHaveLength(1);
            expect(student.countries.map((c: any) => c.id)).not.toContain('it');
        });

        it('should sync tasks when countries change', async () => {
            // Add a second country
            await request(app.getHttpServer())
                .patch(`/api/admin/students/${testStudentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    countryIds: ['at', 'it'],
                })
                .expect(200);

            // Wait for task sync
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verify tasks exist for both countries
            const tasks = await taskRepo.find({
                where: { studentId: testStudentId },
            });

            expect(tasks.length).toBeGreaterThan(0);
            // Note: Actual task count depends on seed data
        });
    });

    describe('Task preservation when removing country', () => {
        let testStudentId: string;
        let taskId: string;

        beforeEach(async () => {
            // Create student with Austria
            const response = await request(app.getHttpServer())
                .post('/api/admin/students')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: `student-preserve-${Date.now()}@test.com`,
                    fullName: 'Preserve Test Student',
                    countryIds: ['at'],
                });

            testStudentId = response.body.id;

            // Wait for initial task sync
            await new Promise(resolve => setTimeout(resolve, 500));

            // Get a task and mark it as DONE
            const tasks = await taskRepo.find({
                where: { studentId: testStudentId },
            });

            if (tasks.length > 0) {
                taskId = tasks[0].id;
                tasks[0].status = TaskStatus.DONE;
                await taskRepo.save(tasks[0]);
            }
        });

        afterEach(async () => {
            if (testStudentId) {
                const student = await studentRepo.findOne({
                    where: { id: testStudentId },
                    relations: ['user'],
                });
                if (student) {
                    await studentRepo.delete(testStudentId);
                    if (student.user) {
                        await userRepo.delete(student.user.id);
                    }
                }
            }
        });

        it('should preserve DONE tasks when country is removed', async () => {
            // Change to different country (effectively removing Austria)
            await request(app.getHttpServer())
                .patch(`/api/admin/students/${testStudentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    countryIds: ['it'], // Switch to Italy only
                })
                .expect(200);

            // Wait for sync
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verify DONE task still exists
            if (taskId) {
                const doneTask = await taskRepo.findOne({
                    where: { id: taskId },
                });

                expect(doneTask).toBeDefined();
                expect(doneTask?.status).toBe(TaskStatus.DONE);
            }
        });
    });

    describe('Edge cases', () => {
        it('should handle student with no countries', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/admin/students')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: `student-nocountry-${Date.now()}@test.com`,
                    fullName: 'No Country Student',
                    countryIds: [],
                })
                .expect(201);

            const studentId = response.body.id;

            // Cleanup
            const student = await studentRepo.findOne({
                where: { id: studentId },
                relations: ['user'],
            });
            if (student) {
                await studentRepo.delete(studentId);
                if (student.user) {
                    await userRepo.delete(student.user.id);
                }
            }
        });

        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .post('/api/admin/students')
                .send({
                    email: 'unauthorized@test.com',
                    fullName: 'Unauthorized Student',
                    countryIds: ['at'],
                })
                .expect(401);
        });
    });
});
