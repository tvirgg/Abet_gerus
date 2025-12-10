import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../entities/student.entity';
import { TasksService } from '../tasks/tasks.service'; // Импортируем TasksService

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    private tasksService: TasksService // Инжектим
  ) {}

  async getStudent(id: string) {
      return this.studentRepo.findOne({ where: { id }, relations: ['user']});
  }

  async updateProfile(id: string, data: Partial<Student>) {
    const student = await this.studentRepo.findOneBy({ id });
    if (!student) throw new NotFoundException('Student not found');

    let needsSync = false;

    if (data.fullName) student.fullName = data.fullName;
    
    // Если меняется страна или программы -> нужно обновить задачи
    if (data.countryId && data.countryId !== student.countryId) {
        student.countryId = data.countryId;
        needsSync = true;
    }
    
    if (data.selectedProgramIds) {
        student.selectedProgramIds = data.selectedProgramIds;
        needsSync = true;
    }
    
    const savedStudent = await this.studentRepo.save(student);

    if (needsSync) {
        // Запускаем синхронизацию задач
        await this.tasksService.syncStudentTasks(savedStudent.id);
    }

    return savedStudent;
  }
}
