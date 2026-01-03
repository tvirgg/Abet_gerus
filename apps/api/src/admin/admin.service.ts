import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull, In } from "typeorm";
import { Country } from "../entities/country.entity";
import { University } from "../entities/university.entity";
import { TaskTemplate } from "../entities/task-template.entity";
import { User } from "../entities/user.entity";
import { Student } from "../entities/student.entity";
import { Company } from "../entities/company.entity";
import { Curator } from "../entities/curator.entity";
import { Role } from "../entities/enums";
import { Program } from "../entities/program.entity";
import { TasksService } from "../tasks/tasks.service";

export const hashPassword = (pwd: string) => `hashed_${pwd}`;
export const unhashPassword = (hash: string) => hash ? hash.replace('hashed_', '') : '';

// Стандартный набор задач для любой новой страны
const DEFAULT_COUNTRY_TASKS = [
  { title: "Загрузить скан загранпаспорта", stage: "Документы", xpReward: 20, description: "Загрузите PDF скан главной страницы паспорта." },
  { title: "Сделать фото для визы", stage: "Документы", xpReward: 15, description: "Фото 3.5х4.5 на белом фоне." },
  { title: "Перевести аттестат/диплом", stage: "Документы", xpReward: 50, description: "Нотариально заверенный перевод на английский или язык страны." },
  { title: "Выбрать программу обучения", stage: "Подготовка", xpReward: 10, description: "Изучите список программ в университетах этой страны." },
  { title: "Написать мотивационное письмо (Draft)", stage: "Творчество", xpReward: 60, description: "Напишите черновик письма, почему вы хотите учиться именно здесь." },
  { title: "Подать заявку на визу", stage: "Виза", xpReward: 100, description: "Запишитесь в консульство и подайте документы." }
];

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Country) private countryRepo: Repository<Country>,
    @InjectRepository(University) private uniRepo: Repository<University>,
    @InjectRepository(TaskTemplate) private taskTplRepo: Repository<TaskTemplate>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(Curator) private curatorRepo: Repository<Curator>,
    @InjectRepository(Program) private programRepo: Repository<Program>,
    private tasksService: TasksService
  ) { }

  async getModerators() {
    const curators = await this.userRepo.find({
      where: { role: Role.CURATOR },
      relations: ['curator'],
      // Добавляем passwordHash в выборку, чтобы его "расшифровать"
      select: ['id', 'email', 'companyId', 'isActive', 'createdAt', 'passwordHash']
    });
    const students = await this.studentRepo.find({ select: ['id', 'fullName', 'countryId', 'xpTotal'] });

    // Возвращаем кураторов с "чистым" паролем
    return {
      curators: curators.map(c => ({ ...c, password: unhashPassword(c.passwordHash) })),
      students
    };
  }

  async getStudents() {
    const students = await this.studentRepo.find({
      relations: { user: true, curator: true }, // Explicit object syntax
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
      password: s.user ? unhashPassword(s.user.passwordHash) : '', // Safe access
      curatorId: s.curatorId,
      curatorName: s.curator?.fullName
    }));
  }

  async getUnassignedStudents() {
    return this.studentRepo.find({
      where: { curatorId: IsNull() },
      order: { fullName: 'ASC' }
    });
  }

  async assignStudentsToCurator(moderatorUserId: string, studentIds: string[]) {
    // 1. Находим профиль куратора по ID пользователя
    const curator = await this.curatorRepo.findOne({ where: { userId: moderatorUserId } });
    if (!curator) {
      throw new NotFoundException("Curator profile not found for this user");
    }

    // 2. Обновляем студентов
    if (studentIds.length > 0) {
      await this.studentRepo.update(
        { id: In(studentIds) },
        { curatorId: curator.id }
      );

      // Синхронизируем задачи (опционально, если логика требует пересчета задач при смене куратора, 
      // но пока задачи привязаны к студенту, так что просто меняем владельца)
    }
    return { success: true };
  }

  // --- ИСПРАВЛЕНО: Реальная логика создания куратора ---
  async createModerator(data: any) {
    const company = await this.companyRepo.findOne({ where: {} });
    if (!company) throw new Error("Company not found");

    // Проверяем, существует ли пользователь с таким email
    const existing = await this.userRepo.findOne({ where: { email: data.email } });
    if (existing) {
      throw new BadRequestException("User with this email already exists");
    }

    // Генерируем пароль, если не передан
    const password = data.password || Math.random().toString(36).slice(-8);

    // 1. Создаем User
    const user = this.userRepo.create({
      email: data.email,
      passwordHash: hashPassword(password),
      role: Role.CURATOR,
      companyId: company.id,
      isActive: true
    });
    const savedUser = await this.userRepo.save(user);

    // 2. Создаем профиль Curator
    const curator = this.curatorRepo.create({
      userId: savedUser.id,
      companyId: company.id,
      fullName: data.fullName,
      specialization: data.specialization,
      bio: data.bio,
      avatarUrl: data.avatarUrl
    });
    await this.curatorRepo.save(curator);

    // Возвращаем объект юзера и сгенерированный пароль (чтобы показать его админу)
    return { ...savedUser, generatedPassword: data.password ? null : password };
  }

  // --- ИСПРАВЛЕНО: Реальная логика обновления куратора ---
  async updateModerator(id: string, data: any) {
    const user = await this.userRepo.findOne({ where: { id }, relations: ['curator'] });
    if (!user) throw new NotFoundException("Moderator not found");

    if (data.email) user.email = data.email;
    if (data.isActive !== undefined) user.isActive = data.isActive;
    // Если пришел пароль - обновляем хеш
    if (data.password) user.passwordHash = hashPassword(data.password);

    await this.userRepo.save(user);

    if (user.curator) {
      if (data.fullName) user.curator.fullName = data.fullName;
      if (data.specialization) user.curator.specialization = data.specialization;
      if (data.bio) user.curator.bio = data.bio;
      if (data.avatarUrl) user.curator.avatarUrl = data.avatarUrl;
      await this.curatorRepo.save(user.curator);
    }
    return user;
  }

  async deleteModerator(id: string) {
    const user = await this.userRepo.findOne({ where: { id, role: Role.CURATOR } });
    if (!user) throw new NotFoundException("Moderator not found");
    await this.userRepo.remove(user); // Каскадно удалит и Curator профиль
    return { success: true };
  }

  async createStudent(data: any) {
    const company = await this.companyRepo.findOne({ where: {} });
    if (!company) throw new Error("Company not found");

    const existing = await this.userRepo.findOne({ where: { email: data.email } });
    if (existing) {
      throw new BadRequestException("User with this email already exists");
    }

    // Multi-country support: accept countryIds array or fall back to single countryId
    const countryIds = data.countryIds || (data.countryId ? [data.countryId] : []);

    // Validate all country IDs exist
    if (countryIds.length > 0) {
      const countries = await this.countryRepo.find({
        where: countryIds.map((id: string) => ({ id }))
      });

      if (countries.length !== countryIds.length) {
        throw new BadRequestException("One or more country IDs are invalid");
      }
    }

    const password = data.password || Math.random().toString(36).slice(-8);

    const user = this.userRepo.create({
      email: data.email,
      passwordHash: hashPassword(password),
      role: Role.STUDENT,
      companyId: company.id,
      isActive: data.isActive !== undefined ? data.isActive : true
    });
    const savedUser = await this.userRepo.save(user);

    const student = this.studentRepo.create({
      userId: savedUser.id,
      companyId: company.id,
      fullName: data.fullName,
      countryId: data.countryId, // Legacy support
      curatorId: data.curatorId || null,
      bindingCode: `S-${Math.floor(1000 + Math.random() * 9000)}`,
      xpTotal: 0
    });
    const savedStudent = await this.studentRepo.save(student);

    // Set countries relationship
    if (countryIds.length > 0) {
      const countries = await this.countryRepo.find({
        where: countryIds.map((id: string) => ({ id }))
      });
      savedStudent.countries = countries;
      await this.studentRepo.save(savedStudent);
    }

    // CRITICAL: Sync tasks for all selected countries
    await this.tasksService.syncStudentTasks(savedStudent.id);

    return { ...savedStudent, generatedPassword: data.password ? null : password };
  }

  async updateStudentAdmin(id: string, data: any) {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['user', 'countries']
    });
    if (!student) throw new NotFoundException("Student not found");

    let countriesChanged = false;

    if (data.fullName) student.fullName = data.fullName;
    if (data.countryId) student.countryId = data.countryId; // Legacy
    if (data.curatorId !== undefined) student.curatorId = data.curatorId;

    // Multi-country update
    if (data.countryIds) {
      // Validate new country IDs
      const countries = await this.countryRepo.find({
        where: data.countryIds.map((id: string) => ({ id }))
      });

      if (countries.length !== data.countryIds.length) {
        throw new BadRequestException("One or more country IDs are invalid");
      }

      student.countries = countries;
      countriesChanged = true;
    }

    await this.studentRepo.save(student);

    // Re-sync tasks if countries changed
    if (countriesChanged) {
      console.log(`[DEBUG] 🔄 Countries changed for student ${student.fullName}, re-syncing tasks...`);
      await this.tasksService.syncStudentTasks(student.id);
    }

    if (data.email || data.isActive !== undefined) {
      if (data.email) student.user.email = data.email;
      if (data.isActive !== undefined) student.user.isActive = data.isActive;
      await this.userRepo.save(student.user);
    }

    return student;
  }

  async deleteStudent(studentId: string) {
    // 1. Находим студента, чтобы получить ID его пользователя (User)
    const student = await this.studentRepo.findOne({ where: { id: studentId } });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    // 2. Удаляем User. 
    // Благодаря { onDelete: 'CASCADE' } в student.entity.ts, 
    // база данных сама удалит запись student, а затем и все tasks.
    await this.userRepo.delete(student.userId);

    return { success: true };
  }

  async resetPassword(userId: string, newPassword?: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException("User not found");

    const password = newPassword || Math.random().toString(36).slice(-8);
    user.passwordHash = hashPassword(password);
    await this.userRepo.save(user);
    return { generatedPassword: password };
  }

  // ... (методы createCountry, getUniversities и др. оставляем как есть) ...

  async createCountry(data: Partial<Country>) {
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

  async createUniversity(data: Partial<University>) {
    return this.uniRepo.save(data);
  }

  async getTaskTemplates() {
    return this.taskTplRepo.find({ order: { id: 'ASC' } });
  }

  async createTaskTemplate(data: Partial<TaskTemplate>) {
    return this.taskTplRepo.save(data);
  }

  async deleteTaskTemplate(id: number) {
    return this.taskTplRepo.delete(id);
  }

  async searchPrograms(query: { countryId?: string; universityId?: string; category?: string; search?: string }) {
    const qb = this.programRepo.createQueryBuilder('program')
      .leftJoinAndSelect('program.university', 'university')
      .leftJoinAndSelect('university.country', 'country');

    if (query.countryId) qb.andWhere('country.id = :cId', { cId: query.countryId });
    if (query.universityId) qb.andWhere('university.id = :uId', { uId: query.universityId });
    if (query.category) qb.andWhere('program.category = :cat', { cat: query.category });
    if (query.search) qb.andWhere('program.title ILIKE :search', { search: `%${query.search}%` });

    return qb.getMany();
  }

  async createProgram(data: Partial<Program>) {
    return this.programRepo.save(data);
  }

  async updateProgram(id: number, data: Partial<Program>) {
    await this.programRepo.update(id, data);
    return this.programRepo.findOneBy({ id });
  }

  async deleteProgram(id: number) {
    return this.programRepo.delete(id);
  }

  // --- НОВЫЙ МЕТОД ---
  async updateCountry(id: string, data: Partial<Country>) {
    await this.countryRepo.update(id, data);
    return this.countryRepo.findOneBy({ id });
  }

  // --- Hierarchy Management ---
  async getHierarchyTasks(context: 'country' | 'university' | 'program', id: string) {
    if (context === 'country') {
      return this.taskTplRepo.find({
        where: { countryId: id, universityId: IsNull(), programId: IsNull() },
        order: { id: 'ASC' }
      });
    }
    if (context === 'university') {
      return this.taskTplRepo.find({
        where: { universityId: id, programId: IsNull() },
        order: { id: 'ASC' }
      });
    }
    if (context === 'program') {
      return this.taskTplRepo.find({
        where: { programId: Number(id) },
        order: { id: 'ASC' }
      });
    }
    return [];
  }

}
