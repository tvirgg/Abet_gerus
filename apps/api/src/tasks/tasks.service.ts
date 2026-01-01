import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Task } from "../entities/task.entity";
import { Student } from "../entities/student.entity";
import { TaskTemplate } from "../entities/task-template.entity";
import { TaskStatus } from "../entities/enums";
import archiver from 'archiver';
import { FilesService } from "../files/files.service";

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private taskRepo: Repository<Task>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(TaskTemplate) private templateRepo: Repository<TaskTemplate>,
    private filesService: FilesService
  ) { }

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

  async downloadZip(userId: string) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) throw new NotFoundException("Student not found");

    const tasks = await this.taskRepo.find({
      where: { studentId: student.id, status: TaskStatus.DONE }
    });

    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    // Обрабатываем файлы параллельно или последовательно. 
    // Для надежности архивации лучше последовательно добавлять в stream.
    for (const task of tasks) {
      if (!task.submission) continue;

      let fileUrl: string | null = null;
      if (typeof task.submission === 'string') {
        fileUrl = task.submission;
      } else if (typeof task.submission === 'object' && task.submission.url) {
        fileUrl = task.submission.url;
      }

      if (!fileUrl) continue;

      try {
        // fileUrl example: http://host:9000/bucket/filename
        const urlObj = new URL(fileUrl);
        const pathParts = urlObj.pathname.split('/');
        const objectName = pathParts[pathParts.length - 1];

        // Красивое имя файла
        let friendlyName = objectName;
        const match = objectName.match(/^\d+-(.+)$/);
        if (match) {
          friendlyName = match[1];
        }

        const safeTitle = task.title.replace(/[^a-zA-Z0-9а-яА-Я ]/g, '_');
        const entryName = `${safeTitle}_${friendlyName}`;

        const stream = await this.filesService.getFileStream(objectName);
        archive.append(stream, { name: entryName });
      } catch (e) {
        console.error(`Failed to archive task ${task.id} file`, e);
      }
    }

    archive.finalize();
    return archive;
  }
}
