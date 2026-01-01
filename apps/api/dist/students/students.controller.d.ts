import { StudentsService } from './students.service';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    getOne(id: string): Promise<import("../entities/student.entity").Student | null>;
    update(id: string, body: any): Promise<import("../entities/student.entity").Student>;
}
