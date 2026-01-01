import { Repository } from 'typeorm';
import { Student } from '../entities/student.entity';
import { TasksService } from '../tasks/tasks.service';
export declare class StudentsService {
    private studentRepo;
    private tasksService;
    constructor(studentRepo: Repository<Student>, tasksService: TasksService);
    getStudent(id: string): Promise<Student | null>;
    updateProfile(id: string, data: Partial<Student>): Promise<Student>;
}
