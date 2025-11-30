import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TasksService } from "./tasks.service";
import { TasksController } from "./tasks.controller";
import { Task } from "../entities/task.entity";
import { Student } from "../entities/student.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Task, Student])],
  providers: [TasksService],
  controllers: [TasksController],
  exports: [TasksService],
})
export class TasksModule {}
