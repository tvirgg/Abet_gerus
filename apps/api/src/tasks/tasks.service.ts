import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Task } from "../entities/task.entity";
import { Student } from "../entities/student.entity";
import { TaskTemplate } from "../entities/task-template.entity";
import { TaskStatus } from "../entities/enums";

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private taskRepo: Repository<Task>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(TaskTemplate) private templateRepo: Repository<TaskTemplate>
  ) {}

  async findAllForUser(userId: string) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) throw new NotFoundException("Student profile not found");

    return this.taskRepo.find({
      where: { studentId: student.id },
      order: { id: 'ASC' }
    });
  }

  async submitTask(taskId: string, submission: any) {
    await this.taskRepo.update(taskId, {
        status: TaskStatus.REVIEW,
        submission: submission
    });
    return this.taskRepo.findOneBy({ id: Number(taskId) });
  }

  async getReviewQueue() {
    return this.taskRepo.find({
      where: { status: TaskStatus.REVIEW },
      relations: ['student']
    });
  }

  async approveTask(taskId: string) {
    const task = await this.taskRepo.findOneBy({ id: Number(taskId) });
    if (!task) throw new NotFoundException();

    task.status = TaskStatus.DONE;
    await this.taskRepo.save(task);
    
    const student = await this.studentRepo.findOneBy({ id: task.studentId });
    if (student) {
        student.xpTotal += task.xpReward;
        await this.studentRepo.save(student);
    }

    return task;
  }

  async requestChanges(taskId: string, comment: string) {
    const task = await this.taskRepo.findOneBy({ id: Number(taskId) });
    if (!task) throw new NotFoundException();

    task.status = TaskStatus.CHANGES_REQUESTED;
    await this.taskRepo.save(task);
    return task;
  }

  /**
   * Основной метод: Синхронизирует задачи студента (по ID студента)
   */
  async syncStudentTasks(studentId: string) {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) return;

    const programIds = student.selectedProgramIds || [];
    const countryId = student.countryId;

    // 1. Находим шаблоны для страны И для выбранных программ
    const applicableTemplates = await this.templateRepo.find({
        where: [
            // Задачи страны (общие)
            { countryId: countryId, programId: undefined }, // null
            // Задачи программ
            ...(programIds.length > 0 ? programIds.map(pid => ({ programId: pid, countryId: countryId })) : [])
        ]
    });

    if (applicableTemplates.length === 0) return;

    // 2. Проверяем, какие уже есть
    const existingTasks = await this.taskRepo.find({
        where: { studentId: student.id },
        select: ['title', 'stage']
    });
    
    const existingKeys = new Set(existingTasks.map(t => `${t.stage}-${t.title}`));

    // 3. Создаем новые
    const templatesToCreate = applicableTemplates.filter(tpl => 
        !existingKeys.has(`${tpl.stage}-${tpl.title}`)
    );

    if (templatesToCreate.length > 0) {
        const newTasks = templatesToCreate.map(t => this.taskRepo.create({
            companyId: student.companyId,
            studentId: student.id,
            stage: t.stage,
            title: t.title,
            description: t.description,
            xpReward: t.xpReward,
            status: TaskStatus.TODO
        }));

        await this.taskRepo.save(newTasks);
        console.log(`[SyncTasks] Created ${newTasks.length} new tasks for student ${student.fullName}`);
    }
  }

  /**
   * Хелпер: Синхронизация по User ID (для вызова из Auth и Контроллера)
   */
  async syncTasksForUser(userId: string) {
      const student = await this.studentRepo.findOne({ where: { userId } });
      if (student) {
          await this.syncStudentTasks(student.id);
      }
  }

  async findAllForStudentEntity(studentId: string) {
    return this.taskRepo.find({
      where: { studentId },
      order: { id: 'ASC' }
    });
  }
}
