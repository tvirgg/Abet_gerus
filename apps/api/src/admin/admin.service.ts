import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Country } from "../entities/country.entity";
import { University } from "../entities/university.entity";
import { TaskTemplate } from "../entities/task-template.entity";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Country) private countryRepo: Repository<Country>,
    @InjectRepository(University) private uniRepo: Repository<University>,
    @InjectRepository(TaskTemplate) private taskTplRepo: Repository<TaskTemplate>,
  ) {}

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
}
