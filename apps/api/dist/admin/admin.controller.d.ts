import { AdminService } from "./admin.service";
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    createCountry(dto: any): Promise<Partial<import("../entities/country.entity").Country> & import("../entities/country.entity").Country>;
    updateCountry(id: string, dto: any): Promise<import("../entities/country.entity").Country | null>;
    getUniversities(): Promise<import("../entities/university.entity").University[]>;
    createUniversity(dto: any): Promise<Partial<import("../entities/university.entity").University> & import("../entities/university.entity").University>;
    getTaskTemplates(): Promise<import("../entities/task-template.entity").TaskTemplate[]>;
    createTaskTemplate(dto: any): Promise<Partial<import("../entities/task-template.entity").TaskTemplate> & import("../entities/task-template.entity").TaskTemplate>;
    deleteTaskTemplate(id: string): Promise<import("typeorm").DeleteResult>;
    searchPrograms(countryId?: string, universityId?: string, category?: string, search?: string): Promise<import("../entities/program.entity").Program[]>;
    createProgram(dto: any): Promise<Partial<import("../entities/program.entity").Program> & import("../entities/program.entity").Program>;
    updateProgram(id: string, dto: any): Promise<import("../entities/program.entity").Program | null>;
    deleteProgram(id: string): Promise<import("typeorm").DeleteResult>;
    getModerators(): Promise<{
        curators: {
            password: string;
            id: string;
            companyId: string;
            company: import("../entities/company.entity").Company;
            email: string;
            passwordHash: string;
            role: import("../entities/enums").Role;
            isActive: boolean;
            createdAt: Date;
            student?: import("../entities/student.entity").Student;
            curator?: import("../entities/curator.entity").Curator;
        }[];
        students: import("../entities/student.entity").Student[];
    }>;
    createModerator(dto: any): Promise<{
        generatedPassword: any;
        id: string;
        companyId: string;
        company: import("../entities/company.entity").Company;
        email: string;
        passwordHash: string;
        role: import("../entities/enums").Role;
        isActive: boolean;
        createdAt: Date;
        student?: import("../entities/student.entity").Student;
        curator?: import("../entities/curator.entity").Curator;
    }>;
    updateModerator(id: string, dto: any): Promise<import("../entities/user.entity").User>;
    deleteModerator(id: string): Promise<{
        success: boolean;
    }>;
    getUnassignedStudents(): Promise<import("../entities/student.entity").Student[]>;
    assignStudents(id: string, body: {
        studentIds: string[];
    }): Promise<{
        success: boolean;
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
    createStudent(dto: any): Promise<{
        generatedPassword: any;
        id: string;
        companyId: string;
        userId: string;
        user: import("../entities/user.entity").User;
        curatorId?: string;
        curator?: import("../entities/curator.entity").Curator;
        fullName: string;
        countryId?: string;
        countries: import("../entities/country.entity").Country[];
        selectedProgramIds: number[];
        bindingCode?: string;
        telegramGroupId?: string;
        xpTotal: number;
        camundaProcessInstanceId?: string;
        tasks: import("../entities/task.entity").Task[];
    }>;
    updateStudent(id: string, body: any): Promise<import("../entities/student.entity").Student>;
    deleteStudent(id: string): Promise<{
        success: boolean;
    }>;
    resetPassword(id: string, password?: string): Promise<{
        generatedPassword: string;
    }>;
}
