import { Injectable, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { CamundaService } from "../camunda/camunda.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtService } from "@nestjs/jwt";
import { TasksService } from "../tasks/tasks.service";
import { User } from "../entities/user.entity";
import { Student } from "../entities/student.entity";
import { Company } from "../entities/company.entity";
import { Role } from "../entities/enums";

const hashPassword = (pwd: string) => `hashed_${pwd}`;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    private readonly dataSource: DataSource,
    private readonly camunda: CamundaService,
    private readonly jwtService: JwtService,
    private readonly tasksService: TasksService
  ) {}

  async register(data: RegisterDto) {
    console.log("Registering user:", data.email, "Role requested:", data.role); // LOG

    const company = await this.companyRepo.findOne({ where: {} }); 
    if (!company) {
        throw new Error("System not initialized: No company found. Run seeds.");
    }

    const existing = await this.userRepo.findOne({
        where: { email: data.email, companyId: company.id }
    });

    if (existing) {
        throw new BadRequestException("User already exists");
    }

    const processKey = process.env.CAMUNDA_REG_PROCESS_KEY || "student_registration";
    let newUser: User;

    // Transaction for User + Student creation
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const user = this.userRepo.create({
            companyId: company.id,
            email: data.email,
            passwordHash: hashPassword(data.password || "12345678"),
            role: (data.role?.toUpperCase() as Role) || Role.STUDENT,
        });
        newUser = await queryRunner.manager.save(user);

        if (newUser.role === Role.STUDENT) {
             const student = this.studentRepo.create({
                companyId: company.id,
                userId: newUser.id,
                fullName: data.fullName || "Student",
                bindingCode: `S-${Math.floor(1000 + Math.random() * 9000)}`,
                countryId: data.countryId
            });
            await queryRunner.manager.save(student);
        }

        await queryRunner.commitTransaction();
    } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
    } finally {
        await queryRunner.release();
    }

    // Camunda
    const variables = {
      email: data.email,
      userId: newUser.id,
      companyId: company.id,
      role: data.role || "student",
      countryId: data.countryId || "",
    };

    let processId = null;
    try {
        const camundaProcess = await this.camunda.startProcessByKey(processKey, variables);
        processId = camundaProcess.id;
    } catch (e: any) {
        console.warn("⚠️ Camunda start failed, but user created:", e.message);
    }

    // Update process ID
    if (newUser.role === Role.STUDENT && processId) {
        await this.studentRepo.update({ userId: newUser.id }, { camundaProcessInstanceId: processId });
    }

    // Generate Initial Tasks
    if (newUser.role === Role.STUDENT) {
        await this.tasksService.generateInitialTasks(newUser.id, data.countryId || 'at');
    }

    return this.login({ email: data.email, password: data.password || "12345678" });
  }

  async login(data: LoginDto) {
    const user = await this.userRepo.findOne({
        where: { email: data.email }
    });

    if (!user || user.passwordHash !== hashPassword(data.password)) {
        throw new UnauthorizedException("Invalid credentials");
    }

    const payload = { sub: user.id, email: user.email, role: user.role, companyId: user.companyId };
    return {
        accessToken: this.jwtService.sign(payload),
        user: {
            id: user.id,
            email: user.email,
            role: user.role
        }
    };
  }

  async getProfile(userId: string) {
      const user = await this.userRepo.findOne({
          where: { id: userId },
          relations: ['student']
      });

      if (!user) throw new UnauthorizedException();

      return {
          id: user.id,
          email: user.email,
          name: user.student?.fullName || user.email,
          role: user.role.toLowerCase(),
          countryId: user.student?.countryId,
      };
  }
}
