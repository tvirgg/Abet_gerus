import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Task } from "../entities/task.entity";
import { Student } from "../entities/student.entity";
import { TaskStatus } from "../entities/enums";

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private taskRepo: Repository<Task>,
    @InjectRepository(Student) private studentRepo: Repository<Student>
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
    // NOTE: If you want to save the comment, add a column to Task entity
    await this.taskRepo.save(task);
    return task;
  }

  async generateInitialTasks(userId: string, countryId: string) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) return;

    const templates = [
        {
            stage: "Подготовка",
            title: "Создать специальную почту Gmail",
            xp: 20,
            description: "Создайте новый аккаунт Gmail...",
            country: "all"
        },
        {
            stage: "Личные документы",
            title: "Сфотографировать и загрузить загранпаспорт",
            xp: 30,
            description: "Сделайте качественный скан...",
            country: "all"
        },
        {
            stage: "Личные документы",
            title: "Собрать школьные документы",
            xp: 50,
            description: "Аттестат и приложение...",
            country: "at"
        },
        {
            stage: "Экзамены",
            title: "Сдать TOLC-I",
            xp: 100,
            description: "Регистрация на CISIA...",
            country: "it"
        }
    ];

    const tasksToCreate = templates
        .filter(t => t.country === 'all' || t.country === countryId)
        .map(t => this.taskRepo.create({
            companyId: student.companyId,
            studentId: student.id,
            stage: t.stage,
            title: t.title,
            description: t.description,
            xpReward: t.xp,
            status: TaskStatus.TODO
        }));

    await this.taskRepo.save(tasksToCreate);
  }
}
