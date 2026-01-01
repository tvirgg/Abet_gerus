import { Repository } from "typeorm";
import { Country } from "../entities/country.entity";
import { University } from "../entities/university.entity";
import { TaskTemplate } from "../entities/task-template.entity";
import { User } from "../entities/user.entity";
import { Student } from "../entities/student.entity";
import { Company } from "../entities/company.entity";
import { Curator } from "../entities/curator.entity";
import { Role } from "../entities/enums";
import { Program } from "../entities/program.entity";
import { TasksService } from "../tasks/tasks.service";
export declare const hashPassword: (pwd: string) => string;
export declare const unhashPassword: (hash: string) => string;
export declare class AdminService {
    private countryRepo;
    private uniRepo;
    private taskTplRepo;
    private userRepo;
    private studentRepo;
    private companyRepo;
    private curatorRepo;
    private programRepo;
    private tasksService;
    constructor(countryRepo: Repository<Country>, uniRepo: Repository<University>, taskTplRepo: Repository<TaskTemplate>, userRepo: Repository<User>, studentRepo: Repository<Student>, companyRepo: Repository<Company>, curatorRepo: Repository<Curator>, programRepo: Repository<Program>, tasksService: TasksService);
    getModerators(): Promise<{
        curators: {
            password: string;
            id: string;
            companyId: string;
            company: Company;
            email: string;
            passwordHash: string;
            role: Role;
            isActive: boolean;
            createdAt: Date;
            student?: Student;
            curator?: Curator;
        }[];
        students: Student[];
    }>;
    getStudents(): Promise<{
        id: string;
        fullName: string;
        countryId: string | undefined;
        xpTotal: number;
        userId: string;
        email: string;
        isActive: boolean;
        password: string;
        curatorId: string | undefined;
        curatorName: string | undefined;
    }[]>;
    getUnassignedStudents(): Promise<Student[]>;
    assignStudentsToCurator(moderatorUserId: string, studentIds: string[]): Promise<{
        success: boolean;
    }>;
    createModerator(data: any): Promise<{
        generatedPassword: any;
        id: string;
        companyId: string;
        company: Company;
        email: string;
        passwordHash: string;
        role: Role;
        isActive: boolean;
        createdAt: Date;
        student?: Student;
        curator?: Curator;
    }>;
    updateModerator(id: string, data: any): Promise<User>;
    deleteModerator(id: string): Promise<{
        success: boolean;
    }>;
    createStudent(data: any): Promise<{
        generatedPassword: any;
        id: string;
        companyId: string;
        userId: string;
        user: User;
        curatorId?: string;
        curator?: Curator;
        fullName: string;
        countryId?: string;
        countries: Country[];
        selectedProgramIds: number[];
        bindingCode?: string;
        telegramGroupId?: string;
        xpTotal: number;
        camundaProcessInstanceId?: string;
        tasks: import("../entities/task.entity").Task[];
    }>;
    updateStudentAdmin(id: string, data: any): Promise<Student>;
    deleteStudent(studentId: string): Promise<{
        success: boolean;
    }>;
    resetPassword(userId: string, newPassword?: string): Promise<{
        generatedPassword: string;
    }>;
    createCountry(data: Partial<Country>): Promise<Partial<Country> & Country>;
    findAllCountries(): Promise<Country[]>;
    getUniversities(): Promise<University[]>;
    createUniversity(data: Partial<University>): Promise<Partial<University> & University>;
    getTaskTemplates(): Promise<TaskTemplate[]>;
    createTaskTemplate(data: Partial<TaskTemplate>): Promise<Partial<TaskTemplate> & TaskTemplate>;
    deleteTaskTemplate(id: number): Promise<import("typeorm").DeleteResult>;
    searchPrograms(query: {
        countryId?: string;
        universityId?: string;
        category?: string;
        search?: string;
    }): Promise<Program[]>;
    createProgram(data: Partial<Program>): Promise<Partial<Program> & Program>;
    updateProgram(id: number, data: Partial<Program>): Promise<Program | null>;
    deleteProgram(id: number): Promise<import("typeorm").DeleteResult>;
    updateCountry(id: string, data: Partial<Country>): Promise<Country | null>;
}
