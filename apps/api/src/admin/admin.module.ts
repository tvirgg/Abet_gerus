import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { Country } from "../entities/country.entity";
import { University } from "../entities/university.entity";
import { Program } from "../entities/program.entity";
import { TaskTemplate } from "../entities/task-template.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Country, University, Program, TaskTemplate])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
