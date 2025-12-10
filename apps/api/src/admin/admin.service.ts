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
import { Program } from "../entities/program.entity"; // Не забудьте импорт

const hashPassword = (pwd: string) => `hashed_${pwd}`;

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
    @InjectRepository(Program) private programRepo: Repository<Program>, // Инъекция репозитория
  ) {}

  async getModerators() {
    const curators = await this.userRepo.find({
      where: { role: Role.CURATOR },
      relations: ['curator'], 
      select: ['id', 'email', 'companyId', 'isActive', 'createdAt']
    });
    
    const students = await this.studentRepo.find({
      select: ['id', 'fullName', 'countryId', 'xpTotal']
    });

    return { curators, students };
  }

  async getStudents() {
    const students = await this.studentRepo.find({
      relations: ['user'],
      order: { fullName: 'ASC' }
    });
    
    return students.map(s => ({
      id: s.id,
      fullName: s.fullName,
      countryId: s.countryId,
      xpTotal: s.xpTotal,
      userId: s.userId,
      email: s.user?.email,
      isActive: s.user?.isActive
    }));
  }

  async createModerator(data: any) {
    const email = data.email;
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new BadRequestException("User already exists");

    const company = await this.companyRepo.findOne({ where: {} });
    if (!company) throw new BadRequestException("No company found");

    const password = data.password || Math.random().toString(36).slice(-8);

    const user = this.userRepo.create({
      email,
      passwordHash: hashPassword(password),
      role: Role.CURATOR,
      companyId: company.id,
      isActive: true
    });

    const savedUser = await this.userRepo.save(user);

    const curator = this.curatorRepo.create({
        userId: savedUser.id,
        companyId: company.id,
        fullName: data.fullName || email.split('@')[0],
        specialization: data.specialization || "Куратор",
        bio: data.bio || "",
        avatarUrl: data.avatarUrl || ""
    });
    await this.curatorRepo.save(curator);

    return { ...savedUser, curator, generatedPassword: password };
  }

  async updateModerator(id: string, data: any) {
    const user = await this.userRepo.findOne({ 
        where: { id },
        relations: ['curator']
    });
    if (!user) throw new NotFoundException("User not found");

    if (data.email) user.email = data.email;
    if (typeof data.isActive === 'boolean') user.isActive = data.isActive;
    if (data.password) {
        user.passwordHash = hashPassword(data.password);
    }

    await this.userRepo.save(user);

    let curator = user.curator;
    if (!curator) {
        curator = this.curatorRepo.create({ userId: user.id, companyId: user.companyId });
    }

    if (data.fullName !== undefined) curator.fullName = data.fullName;
    if (data.specialization !== undefined) curator.specialization = data.specialization;
    if (data.bio !== undefined) curator.bio = data.bio;
    if (data.avatarUrl !== undefined) curator.avatarUrl = data.avatarUrl;

    await this.curatorRepo.save(curator);

    return { ...user, curator };
  }

  async createCountry(data: Partial<Country>) {
    return this.countryRepo.save(data);
  }

  async getUniversities() {
    return this.uniRepo.find({ relations: ['country'] });
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
  
  // --- Programs Logic ---
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
  // ---------------------
  
  async resetPassword(userId: string, newPassword?: string) {
      const user = await this.userRepo.findOneBy({ id: userId });
      if (!user) throw new NotFoundException("User not found");
      
      const pass = newPassword || "12345678";
      user.passwordHash = hashPassword(pass);
      await this.userRepo.save(user);
      return { message: "Password reset successfully", tempPassword: pass };
  }
}
