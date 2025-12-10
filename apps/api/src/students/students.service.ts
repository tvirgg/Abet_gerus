import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../entities/student.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student) private studentRepo: Repository<Student>,
  ) {}

  async updateProfile(id: string, data: Partial<Student>) {
    const student = await this.studentRepo.findOneBy({ id });
    if (!student) throw new NotFoundException('Student not found');

    // Разрешаем обновлять только безопасные поля
    if (data.fullName) student.fullName = data.fullName;
    if (data.countryId) student.countryId = data.countryId;
    // TODO: Обработка смены программ (selectedProgramIds) потребовала бы обновления Tasks
    
    return this.studentRepo.save(student);
  }
  
  async getStudent(id: string) {
      return this.studentRepo.findOne({ where: { id }, relations: ['user']});
  }
}
