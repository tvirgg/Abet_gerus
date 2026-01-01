import { Response } from 'express';
import { TasksService } from "./tasks.service";
import { SubmitTaskDto } from "./dto/submit-task.dto";
import { RejectTaskDto } from "./dto/approve-task.dto";
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    getMyTasks(req: any): Promise<import("../entities/task.entity").Task[]>;
    submitTask(id: string, body: SubmitTaskDto): Promise<import("../entities/task.entity").Task | null>;
    getReviewQueue(req: any): Promise<import("../entities/task.entity").Task[]>;
    approveTask(id: string): Promise<import("../entities/task.entity").Task>;
    requestChanges(id: string, body: RejectTaskDto): Promise<import("../entities/task.entity").Task>;
    getStudentTasks(studentId: string): Promise<import("../entities/task.entity").Task[]>;
    generate(req: any): Promise<void>;
    downloadZip(req: any, res: Response): Promise<void>;
}
