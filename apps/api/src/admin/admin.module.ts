import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { Country } from "../entities/country.entity";
import { University } from "../entities/university.entity";
import { Program } from "../entities/program.entity"; // Импорт
import { TaskTemplate } from "../entities/task-template.entity";
import { User } from "../entities/user.entity";
import { Student } from "../entities/student.entity";
import { Company } from "../entities/company.entity";
import { Curator } from "../entities/curator.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Country, 
      University, 
      Program, // <--- Обязательно здесь
      TaskTemplate, 
      User, 
      Student, 
      Company, 
      Curator
    ])
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
