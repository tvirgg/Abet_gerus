import { Student } from './student.entity';
import { TaskStatus } from './enums';
export declare class Task {
    id: number;
    companyId: string;
    studentId: string;
    student: Student;
    stage: string;
    title: string;
    description: string;
    xpReward: number;
    status: TaskStatus;
    submission?: any;
}
