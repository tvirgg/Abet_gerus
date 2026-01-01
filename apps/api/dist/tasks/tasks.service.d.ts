import { Repository } from "typeorm";
import { Task } from "../entities/task.entity";
import { Student } from "../entities/student.entity";
import { TaskTemplate } from "../entities/task-template.entity";
import archiver from 'archiver';
import { FilesService } from "../files/files.service";
export declare class TasksService {
    private taskRepo;
    private studentRepo;
    private templateRepo;
    private filesService;
    constructor(taskRepo: Repository<Task>, studentRepo: Repository<Student>, templateRepo: Repository<TaskTemplate>, filesService: FilesService);
    findAllForUser(userId: string): Promise<Task[]>;
    submitTask(taskId: string, submission: any): Promise<Task | null>;
    getReviewQueue(): Promise<Task[]>;
    approveTask(taskId: string): Promise<Task>;
    requestChanges(taskId: string, comment: string): Promise<Task>;
    syncStudentTasks(studentId: string): Promise<void>;
    syncTasksForUser(userId: string): Promise<void>;
    findAllForStudentEntity(studentId: string): Promise<Task[]>;
    downloadZip(userId: string): Promise<archiver.Archiver>;
}
