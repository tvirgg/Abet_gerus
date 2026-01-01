"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const camunda_service_1 = require("../camunda/camunda.service");
const jwt_1 = require("@nestjs/jwt");
const tasks_service_1 = require("../tasks/tasks.service");
const user_entity_1 = require("../entities/user.entity");
const student_entity_1 = require("../entities/student.entity");
const company_entity_1 = require("../entities/company.entity");
const country_entity_1 = require("../entities/country.entity");
const enums_1 = require("../entities/enums");
const hashPassword = (pwd) => `hashed_${pwd}`;
let AuthService = class AuthService {
    constructor(userRepo, studentRepo, companyRepo, countryRepo, dataSource, camunda, jwtService, tasksService) {
        this.userRepo = userRepo;
        this.studentRepo = studentRepo;
        this.companyRepo = companyRepo;
        this.countryRepo = countryRepo;
        this.dataSource = dataSource;
        this.camunda = camunda;
        this.jwtService = jwtService;
        this.tasksService = tasksService;
    }
    async register(data) {
        console.log("Registering user:", data.email, "Role requested:", data.role);
        const company = await this.companyRepo.findOne({ where: {} });
        if (!company) {
            throw new Error("System not initialized: No company found. Run seeds.");
        }
        const existing = await this.userRepo.findOne({
            where: { email: data.email, companyId: company.id }
        });
        if (existing) {
            throw new common_1.BadRequestException("User already exists");
        }
        const countryIds = data.countryIds || (data.countryId ? [data.countryId] : []);
        const processKey = process.env.CAMUNDA_REG_PROCESS_KEY || "student_registration";
        let newUser;
        let studentId = null;
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const user = this.userRepo.create({
                companyId: company.id,
                email: data.email,
                passwordHash: hashPassword(data.password || "12345678"),
                role: data.role?.toUpperCase() || enums_1.Role.STUDENT,
            });
            newUser = await queryRunner.manager.save(user);
            if (newUser.role === enums_1.Role.STUDENT) {
                const student = this.studentRepo.create({
                    companyId: company.id,
                    userId: newUser.id,
                    fullName: data.fullName || "Student",
                    bindingCode: `S-${Math.floor(1000 + Math.random() * 9000)}`,
                    countryId: data.countryId
                });
                const savedStudent = await queryRunner.manager.save(student);
                studentId = savedStudent.id;
            }
            await queryRunner.commitTransaction();
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
        if (newUser.role === enums_1.Role.STUDENT && studentId && countryIds.length > 0) {
            const student = await this.studentRepo.findOne({ where: { id: studentId } });
            if (student) {
                const countries = await this.countryRepo.find({
                    where: countryIds.map(id => ({ id }))
                });
                student.countries = countries;
                await this.studentRepo.save(student);
            }
        }
        const variables = {
            email: data.email,
            userId: newUser.id,
            companyId: company.id,
            role: data.role || "student",
            countryId: data.countryId || "",
        };
        let processId = null;
        try {
            const camundaProcess = await this.camunda.startProcessByKey(processKey, variables);
            processId = camundaProcess.id;
        }
        catch (e) {
            console.warn("⚠️ Camunda start failed, but user created:", e.message);
        }
        if (newUser.role === enums_1.Role.STUDENT && processId) {
            await this.studentRepo.update({ userId: newUser.id }, { camundaProcessInstanceId: processId });
        }
        if (newUser.role === enums_1.Role.STUDENT) {
            await this.tasksService.syncTasksForUser(newUser.id);
        }
        return this.login({ email: data.email, password: data.password || "12345678" });
    }
    async login(data) {
        const user = await this.userRepo.findOne({
            where: { email: data.email }
        });
        if (!user || user.passwordHash !== hashPassword(data.password)) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        const payload = { sub: user.id, email: user.email, role: user.role, companyId: user.companyId };
        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        };
    }
    async getProfile(userId) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['student', 'curator']
        });
        if (!user)
            throw new common_1.UnauthorizedException();
        return {
            id: user.id,
            email: user.email,
            name: user.student?.fullName || user.curator?.fullName || user.email,
            role: user.role.toLowerCase(),
            countryId: user.student?.countryId,
            curatorId: user.curator?.id
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __param(3, (0, typeorm_1.InjectRepository)(country_entity_1.Country)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        camunda_service_1.CamundaService,
        jwt_1.JwtService,
        tasks_service_1.TasksService])
], AuthService);
