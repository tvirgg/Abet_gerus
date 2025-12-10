import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Country } from "../entities/country.entity";
import { University } from "../entities/university.entity";
import { TaskTemplate } from "../entities/task-template.entity";
import { User } from "../entities/user.entity";
import { Student } from "../entities/student.entity";
import { Company } from "../entities/company.entity";
import { Curator } from "../entities/curator.entity";
import { Role } from "../entities/enums";
import { Program } from "../entities/program.entity";

const hashPassword = (pwd: string) => `hashed_${pwd}`;

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
  ) {}

  // ... (методы getModerators, createModerator, updateModerator, getStudents остаются без изменений)
  async getModerators() {
    const curators = await this.userRepo.find({
      where: { role: Role.CURATOR },
      relations: ['curator'], 
      select: ['id', 'email', 'companyId', 'isActive', 'createdAt']
    });
    const students = await this.studentRepo.find({ select: ['id', 'fullName', 'countryId', 'xpTotal'] });
    return { curators, students };
  }

  async getStudents() {
    const students = await this.studentRepo.find({
      relations: ['user', 'curator'], // <-- Грузим связь с куратором
      order: { fullName: 'ASC' }
    });
    
    return students.map(s => ({
      id: s.id,
      fullName: s.fullName,
      countryId: s.countryId,
      xpTotal: s.xpTotal,
      userId: s.userId,
      email: s.user?.email,
      isActive: s.user?.isActive,
      // --- НОВЫЕ ПОЛЯ ---
      curatorId: s.curatorId,
      curatorName: s.curator?.fullName
    }));
  }

  // --- НОВЫЙ МЕТОД ---
  async updateStudentAdmin(id: string, data: any) {
      const student = await this.studentRepo.findOne({ where: { id }, relations: ['user'] });
      if (!student) throw new NotFoundException("Student not found");

      if (data.fullName) student.fullName = data.fullName;
      if (data.countryId) student.countryId = data.countryId;
      // Обновление куратора
      if (data.curatorId !== undefined) student.curatorId = data.curatorId;
      
      await this.studentRepo.save(student);

      // Обновление данных юзера (активность/email)
      if (data.email || data.isActive !== undefined) {
          if (data.email) student.user.email = data.email;
          if (data.isActive !== undefined) student.user.isActive = data.isActive;
          await this.userRepo.save(student.user);
      }

      return student;
  }

  async createModerator(data: any) { /* ... код из предыдущих файлов ... */ return {}; } // (сокращено для краткости ответа, используйте код из предыдущего контекста)
  async updateModerator(id: string, data: any) { /* ... код из предыдущих файлов ... */ return {}; }
  async resetPassword(userId: string, newPassword?: string) { /* ... код из предыдущих файлов ... */ return {}; }


  // === Countries & Tasks Logic ===

  async createCountry(data: Partial<Country>) {
    // 1. Создаем страну
    const country = await this.countryRepo.save(data);

    // 2. Генерируем стандартные задачи для этой страны
    const tasksToCreate = DEFAULT_COUNTRY_TASKS.map(t => this.taskTplRepo.create({
        ...t,
        countryId: country.id,
        // companyId берем дефолтный или из контекста, здесь упростим
    }));

    await this.taskTplRepo.save(tasksToCreate);

    return country;
  }

  async findAllCountries() {
      return this.countryRepo.find({ order: { name: 'ASC' } });
  }

  async getUniversities() {
    // Возвращаем университеты вместе с программами для удобства фронтенда
    return this.uniRepo.find({ 
        relations: ['country', 'programs'],
        order: { name: 'ASC' }
    });
  }

  async createUniversity(data: Partial<University>) {
    return this.uniRepo.save(data);
  }

  // === Task Templates ===

  async getTaskTemplates() {
    return this.taskTplRepo.find({ order: { id: 'ASC' } });
  }

  async createTaskTemplate(data: Partial<TaskTemplate>) {
    return this.taskTplRepo.save(data);
  }

  async deleteTaskTemplate(id: number) {
      return this.taskTplRepo.delete(id);
  }
  
  // === Programs Logic ===
  
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
    // При создании программы можно также добавить специфичные задачи, если нужно
    return this.programRepo.save(data);
  }

  async updateProgram(id: number, data: Partial<Program>) {
    await this.programRepo.update(id, data);
    return this.programRepo.findOneBy({ id });
  }

  async deleteProgram(id: number) {
    return this.programRepo.delete(id);
  }
}
