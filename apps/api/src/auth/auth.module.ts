import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CamundaModule } from "../camunda/camunda.module";
import { JwtStrategy } from "./jwt.strategy";
import { TasksModule } from "../tasks/tasks.module";
import { User } from "../entities/user.entity";
import { Student } from "../entities/student.entity";
import { Company } from "../entities/company.entity";
import { Country } from "../entities/country.entity";

@Module({
  imports: [
    CamundaModule,
    PassportModule,
    TasksModule,
    TypeOrmModule.forFeature([User, Student, Company, Country]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || "dev_secret_key",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule { }
