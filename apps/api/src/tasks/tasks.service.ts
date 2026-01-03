import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, IsNull } from "typeorm";
import { Task } from "../entities/task.entity";
import { Student } from "../entities/student.entity";
import { TaskTemplate } from "../entities/task-template.entity";
import { Program } from "../entities/program.entity";
import { TaskStatus } from "../entities/enums";
import archiver from 'archiver';
import { FilesService } from "../files/files.service";

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private taskRepo: Repository<Task>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(TaskTemplate) private templateRepo: Repository<TaskTemplate>,
    @InjectRepository(Program) private programRepo: Repository<Program>,
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
   * Supports Cascading Hierarchy: Country -> University -> Program
   */
  async syncStudentTasks(studentId: string) {
    console.log(`[DEBUG] 🔄 syncStudentTasks called for studentId: ${studentId}`);

    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      relations: ['countries']
    });

    if (!student) {
      console.warn(`[DEBUG] ⚠️ Student not found: ${studentId}`);
      return;
    }

    // 1. Resolve Contexts
    const countryIds = student.countries?.length > 0
      ? student.countries.map(c => c.id)
      : (student.countryId ? [student.countryId] : []);

    const programIds = student.selectedProgramIds || [];

    // Resolve University IDs from Programs
    let universityIds: string[] = [];
    if (programIds.length > 0) {
      const programs = await this.programRepo.find({
        where: { id: In(programIds) },
        select: ['universityId']
      });
      universityIds = [...new Set(programs.map(p => p.universityId))];
    }

    console.log(`[DEBUG] 📍 Contexts - Countries: [${countryIds}], Unis: [${universityIds}], Programs: [${programIds}]`);

    // 2. Fetch Templates (Cascading Logic)
    // We want tasks that match ANY of the specific contexts.
    // Use IsNull() to ensure we pick the specific level's generic tasks, avoiding over-matching if data is messy.

    const whereConditions: any[] = [];

    // Level 1: Country Generic Tasks (No Uni/Program specific)
    if (countryIds.length > 0) {
      whereConditions.push({
        countryId: In(countryIds),
        universityId: IsNull(),
        programId: IsNull()
      });
    }

    // Level 2: University Tasks (No Program specific)
    if (universityIds.length > 0) {
      whereConditions.push({
        universityId: In(universityIds),
        programId: IsNull()
      });
    }

    // Level 3: Program Specific Tasks
    if (programIds.length > 0) {
      whereConditions.push({
        programId: In(programIds)
      });
    }

    if (whereConditions.length === 0) {
      console.log(`[DEBUG] ℹ️ No active contexts (countries/programs) for student, skipping sync.`);
      return;
    }

    const applicableTemplates = await this.templateRepo.find({
      where: whereConditions
    });

    console.log(`[DEBUG] 📋 Found ${applicableTemplates.length} applicable templates (Total)`);

    // 3. Deduplicate Templates (Logic: latest by stage+title? Or just union?)
    // Currently, we just union them. If a task exists in multiple levels with same title/stage, we should likely prefer the MORE SPECIFIC one?
    // "Cascading" implies specifics override generals. 
    // Implementation: Group by key (stage+title), pick logic. For now, we'll process all unique combinations.
    // BUT: If "Upload Passport" is at Country level AND Program level (super specific passport?), we might want only one.
    // Standard logic: Group by 'title' (or unique code).
    // Let's assume unique 'title' per 'stage' is the key.

    // Priorities: Program > University > Country
    const templateMap = new Map<string, TaskTemplate>();

    // Sort to process specific first? No, map overwrites.
    // We want Higher Priority to stay in the map.
    // Let's iterate and inserting based on priority score.
    const getPriority = (t: TaskTemplate) => {
      if (t.programId) return 3;
      if (t.universityId) return 2;
      if (t.countryId) return 1;
      return 0;
    };

    for (const tpl of applicableTemplates) {
      const key = `${tpl.stage}-${tpl.title}`;
      const existing = templateMap.get(key);

      if (!existing || getPriority(tpl) > getPriority(existing)) {
        templateMap.set(key, tpl);
      }
    }

    const finalTemplates = Array.from(templateMap.values());
    console.log(`[DEBUG] 📉 After deduplication/override: ${finalTemplates.length} templates`);

    // 4. Create Missing Tasks
    const existingTasks = await this.taskRepo.find({
      where: { studentId: student.id },
      select: ['title', 'stage']
    });

    const existingKeys = new Set(existingTasks.map(t => `${t.stage}-${t.title}`));
    const templatesToCreate = finalTemplates.filter(tpl =>
      !existingKeys.has(`${tpl.stage}-${tpl.title}`)
    );

    console.log(`[DEBUG] 🆕 Will create ${templatesToCreate.length} new tasks`);

    if (templatesToCreate.length > 0) {
      const newTasks = templatesToCreate.map(t => this.taskRepo.create({
        companyId: student.companyId,
        studentId: student.id,
        stage: t.stage,
        title: t.title,
        description: t.description,
        xpReward: t.xpReward,
        status: TaskStatus.TODO,
        submission_type: t.submissionType as any,
        hint: t.hint,
        advice: t.advice, // Populate advice
        accepted_formats: t.accepted_formats
      }));

      await this.taskRepo.save(newTasks);
      console.log(`[DEBUG] ✅ Created ${newTasks.length} tasks`);
    } else {
      console.log(`[DEBUG] ℹ️ No new tasks to create`);
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
