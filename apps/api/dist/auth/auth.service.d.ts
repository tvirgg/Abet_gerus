import { Repository, DataSource } from "typeorm";
import { CamundaService } from "../camunda/camunda.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtService } from "@nestjs/jwt";
import { TasksService } from "../tasks/tasks.service";
import { User } from "../entities/user.entity";
import { Student } from "../entities/student.entity";
import { Company } from "../entities/company.entity";
import { Country } from "../entities/country.entity";
import { Role } from "../entities/enums";
export declare class AuthService {
    private userRepo;
    private studentRepo;
    private companyRepo;
    private countryRepo;
    private readonly dataSource;
    private readonly camunda;
    private readonly jwtService;
    private readonly tasksService;
    constructor(userRepo: Repository<User>, studentRepo: Repository<Student>, companyRepo: Repository<Company>, countryRepo: Repository<Country>, dataSource: DataSource, camunda: CamundaService, jwtService: JwtService, tasksService: TasksService);
    register(data: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            role: Role;
        };
    }>;
    login(data: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            role: Role;
        };
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
        countryId: string | undefined;
        curatorId: string | undefined;
    }>;
}
