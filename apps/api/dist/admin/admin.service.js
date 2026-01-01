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
exports.AdminService = exports.unhashPassword = exports.hashPassword = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const country_entity_1 = require("../entities/country.entity");
const university_entity_1 = require("../entities/university.entity");
const task_template_entity_1 = require("../entities/task-template.entity");
const user_entity_1 = require("../entities/user.entity");
const student_entity_1 = require("../entities/student.entity");
const company_entity_1 = require("../entities/company.entity");
const curator_entity_1 = require("../entities/curator.entity");
const enums_1 = require("../entities/enums");
const program_entity_1 = require("../entities/program.entity");
const tasks_service_1 = require("../tasks/tasks.service");
const hashPassword = (pwd) => `hashed_${pwd}`;
exports.hashPassword = hashPassword;
const unhashPassword = (hash) => hash ? hash.replace('hashed_', '') : '';
exports.unhashPassword = unhashPassword;
const DEFAULT_COUNTRY_TASKS = [
    { title: "Загрузить скан загранпаспорта", stage: "Документы", xpReward: 20, description: "Загрузите PDF скан главной страницы паспорта." },
    { title: "Сделать фото для визы", stage: "Документы", xpReward: 15, description: "Фото 3.5х4.5 на белом фоне." },
    { title: "Перевести аттестат/диплом", stage: "Документы", xpReward: 50, description: "Нотариально заверенный перевод на английский или язык страны." },
    { title: "Выбрать программу обучения", stage: "Подготовка", xpReward: 10, description: "Изучите список программ в университетах этой страны." },
    { title: "Написать мотивационное письмо (Draft)", stage: "Творчество", xpReward: 60, description: "Напишите черновик письма, почему вы хотите учиться именно здесь." },
    { title: "Подать заявку на визу", stage: "Виза", xpReward: 100, description: "Запишитесь в консульство и подайте документы." }
];
let AdminService = class AdminService {
    constructor(countryRepo, uniRepo, taskTplRepo, userRepo, studentRepo, companyRepo, curatorRepo, programRepo, tasksService) {
        this.countryRepo = countryRepo;
        this.uniRepo = uniRepo;
        this.taskTplRepo = taskTplRepo;
        this.userRepo = userRepo;
        this.studentRepo = studentRepo;
        this.companyRepo = companyRepo;
        this.curatorRepo = curatorRepo;
        this.programRepo = programRepo;
        this.tasksService = tasksService;
    }
    async getModerators() {
        const curators = await this.userRepo.find({
            where: { role: enums_1.Role.CURATOR },
            relations: ['curator'],
            select: ['id', 'email', 'companyId', 'isActive', 'createdAt', 'passwordHash']
        });
        const students = await this.studentRepo.find({ select: ['id', 'fullName', 'countryId', 'xpTotal'] });
        return {
            curators: curators.map(c => ({ ...c, password: (0, exports.unhashPassword)(c.passwordHash) })),
            students
        };
    }
    async getStudents() {
        const students = await this.studentRepo.find({
            relations: { user: true, curator: true },
            order: { fullName: 'ASC' }
        });
        return students.map(s => ({
            id: s.id,
            fullName: s.fullName,
            countryId: s.countryId,
            xpTotal: s.xpTotal,
            userId: s.userId,
            email: s.user?.email || 'No Email',
            isActive: s.user?.isActive ?? false,
            password: s.user ? (0, exports.unhashPassword)(s.user.passwordHash) : '',
            curatorId: s.curatorId,
            curatorName: s.curator?.fullName
        }));
    }
    async getUnassignedStudents() {
        return this.studentRepo.find({
            where: { curatorId: (0, typeorm_2.IsNull)() },
            order: { fullName: 'ASC' }
        });
    }
    async assignStudentsToCurator(moderatorUserId, studentIds) {
        const curator = await this.curatorRepo.findOne({ where: { userId: moderatorUserId } });
        if (!curator) {
            throw new common_1.NotFoundException("Curator profile not found for this user");
        }
        if (studentIds.length > 0) {
            await this.studentRepo.update({ id: (0, typeorm_2.In)(studentIds) }, { curatorId: curator.id });
        }
        return { success: true };
    }
    async createModerator(data) {
        const company = await this.companyRepo.findOne({ where: {} });
        if (!company)
            throw new Error("Company not found");
        const existing = await this.userRepo.findOne({ where: { email: data.email } });
        if (existing) {
            throw new common_1.BadRequestException("User with this email already exists");
        }
        const password = data.password || Math.random().toString(36).slice(-8);
        const user = this.userRepo.create({
            email: data.email,
            passwordHash: (0, exports.hashPassword)(password),
            role: enums_1.Role.CURATOR,
            companyId: company.id,
            isActive: true
        });
        const savedUser = await this.userRepo.save(user);
        const curator = this.curatorRepo.create({
            userId: savedUser.id,
            companyId: company.id,
            fullName: data.fullName,
            specialization: data.specialization,
            bio: data.bio,
            avatarUrl: data.avatarUrl
        });
        await this.curatorRepo.save(curator);
        return { ...savedUser, generatedPassword: data.password ? null : password };
    }
    async updateModerator(id, data) {
        const user = await this.userRepo.findOne({ where: { id }, relations: ['curator'] });
        if (!user)
            throw new common_1.NotFoundException("Moderator not found");
        if (data.email)
            user.email = data.email;
        if (data.isActive !== undefined)
            user.isActive = data.isActive;
        if (data.password)
            user.passwordHash = (0, exports.hashPassword)(data.password);
        await this.userRepo.save(user);
        if (user.curator) {
            if (data.fullName)
                user.curator.fullName = data.fullName;
            if (data.specialization)
                user.curator.specialization = data.specialization;
            if (data.bio)
                user.curator.bio = data.bio;
            if (data.avatarUrl)
                user.curator.avatarUrl = data.avatarUrl;
            await this.curatorRepo.save(user.curator);
        }
        return user;
    }
    async deleteModerator(id) {
        const user = await this.userRepo.findOne({ where: { id, role: enums_1.Role.CURATOR } });
        if (!user)
            throw new common_1.NotFoundException("Moderator not found");
        await this.userRepo.remove(user);
        return { success: true };
    }
    async createStudent(data) {
        const company = await this.companyRepo.findOne({ where: {} });
        if (!company)
            throw new Error("Company not found");
        const existing = await this.userRepo.findOne({ where: { email: data.email } });
        if (existing) {
            throw new common_1.BadRequestException("User with this email already exists");
        }
        const countryIds = data.countryIds || (data.countryId ? [data.countryId] : []);
        if (countryIds.length > 0) {
            const countries = await this.countryRepo.find({
                where: countryIds.map((id) => ({ id }))
            });
            if (countries.length !== countryIds.length) {
                throw new common_1.BadRequestException("One or more country IDs are invalid");
            }
        }
        const password = data.password || Math.random().toString(36).slice(-8);
        const user = this.userRepo.create({
            email: data.email,
            passwordHash: (0, exports.hashPassword)(password),
            role: enums_1.Role.STUDENT,
            companyId: company.id,
            isActive: data.isActive !== undefined ? data.isActive : true
        });
        const savedUser = await this.userRepo.save(user);
        const student = this.studentRepo.create({
            userId: savedUser.id,
            companyId: company.id,
            fullName: data.fullName,
            countryId: data.countryId,
            curatorId: data.curatorId || null,
            bindingCode: `S-${Math.floor(1000 + Math.random() * 9000)}`,
            xpTotal: 0
        });
        const savedStudent = await this.studentRepo.save(student);
        if (countryIds.length > 0) {
            const countries = await this.countryRepo.find({
                where: countryIds.map((id) => ({ id }))
            });
            savedStudent.countries = countries;
            await this.studentRepo.save(savedStudent);
        }
        await this.tasksService.syncStudentTasks(savedStudent.id);
        return { ...savedStudent, generatedPassword: data.password ? null : password };
    }
    async updateStudentAdmin(id, data) {
        const student = await this.studentRepo.findOne({
            where: { id },
            relations: ['user', 'countries']
        });
        if (!student)
            throw new common_1.NotFoundException("Student not found");
        let countriesChanged = false;
        if (data.fullName)
            student.fullName = data.fullName;
        if (data.countryId)
            student.countryId = data.countryId;
        if (data.curatorId !== undefined)
            student.curatorId = data.curatorId;
        if (data.countryIds) {
            const countries = await this.countryRepo.find({
                where: data.countryIds.map((id) => ({ id }))
            });
            if (countries.length !== data.countryIds.length) {
                throw new common_1.BadRequestException("One or more country IDs are invalid");
            }
            student.countries = countries;
            countriesChanged = true;
        }
        await this.studentRepo.save(student);
        if (countriesChanged) {
            console.log(`[DEBUG] 🔄 Countries changed for student ${student.fullName}, re-syncing tasks...`);
            await this.tasksService.syncStudentTasks(student.id);
        }
        if (data.email || data.isActive !== undefined) {
            if (data.email)
                student.user.email = data.email;
            if (data.isActive !== undefined)
                student.user.isActive = data.isActive;
            await this.userRepo.save(student.user);
        }
        return student;
    }
    async deleteStudent(studentId) {
        const student = await this.studentRepo.findOne({ where: { id: studentId } });
        if (!student) {
            throw new common_1.NotFoundException("Student not found");
        }
        await this.userRepo.delete(student.userId);
        return { success: true };
    }
    async resetPassword(userId, newPassword) {
        const user = await this.userRepo.findOneBy({ id: userId });
        if (!user)
            throw new common_1.NotFoundException("User not found");
        const password = newPassword || Math.random().toString(36).slice(-8);
        user.passwordHash = (0, exports.hashPassword)(password);
        await this.userRepo.save(user);
        return { generatedPassword: password };
    }
    async createCountry(data) {
        const country = await this.countryRepo.save(data);
        const tasksToCreate = DEFAULT_COUNTRY_TASKS.map(t => this.taskTplRepo.create({
            ...t,
            countryId: country.id,
        }));
        await this.taskTplRepo.save(tasksToCreate);
        return country;
    }
    async findAllCountries() {
        return this.countryRepo.find({ order: { name: 'ASC' } });
    }
    async getUniversities() {
        return this.uniRepo.find({
            relations: ['country', 'programs'],
            order: { name: 'ASC' }
        });
    }
    async createUniversity(data) {
        return this.uniRepo.save(data);
    }
    async getTaskTemplates() {
        return this.taskTplRepo.find({ order: { id: 'ASC' } });
    }
    async createTaskTemplate(data) {
        return this.taskTplRepo.save(data);
    }
    async deleteTaskTemplate(id) {
        return this.taskTplRepo.delete(id);
    }
    async searchPrograms(query) {
        const qb = this.programRepo.createQueryBuilder('program')
            .leftJoinAndSelect('program.university', 'university')
            .leftJoinAndSelect('university.country', 'country');
        if (query.countryId)
            qb.andWhere('country.id = :cId', { cId: query.countryId });
        if (query.universityId)
            qb.andWhere('university.id = :uId', { uId: query.universityId });
        if (query.category)
            qb.andWhere('program.category = :cat', { cat: query.category });
        if (query.search)
            qb.andWhere('program.title ILIKE :search', { search: `%${query.search}%` });
        return qb.getMany();
    }
    async createProgram(data) {
        return this.programRepo.save(data);
    }
    async updateProgram(id, data) {
        await this.programRepo.update(id, data);
        return this.programRepo.findOneBy({ id });
    }
    async deleteProgram(id) {
        return this.programRepo.delete(id);
    }
    async updateCountry(id, data) {
        await this.countryRepo.update(id, data);
        return this.countryRepo.findOneBy({ id });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(country_entity_1.Country)),
    __param(1, (0, typeorm_1.InjectRepository)(university_entity_1.University)),
    __param(2, (0, typeorm_1.InjectRepository)(task_template_entity_1.TaskTemplate)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(5, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __param(6, (0, typeorm_1.InjectRepository)(curator_entity_1.Curator)),
    __param(7, (0, typeorm_1.InjectRepository)(program_entity_1.Program)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        tasks_service_1.TasksService])
], AdminService);
