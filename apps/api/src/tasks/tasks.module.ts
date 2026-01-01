import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TasksService } from "./tasks.service";
import { TasksController } from "./tasks.controller";
import { Task } from "../entities/task.entity";
import { Student } from "../entities/student.entity";
import { TaskTemplate } from "../entities/task-template.entity"; // <-- Добавили
import { FilesModule } from "../files/files.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Student, TaskTemplate]),
    FilesModule // Import FilesModule
  ],
  providers: [TasksService],
  controllers: [TasksController],
  exports: [TasksService],
})
export class TasksModule { }
