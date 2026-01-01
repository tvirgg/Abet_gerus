import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CamundaModule } from "./camunda/camunda.module";
import { AuthModule } from "./auth/auth.module";
import { CountriesModule } from "./countries/countries.module";
import { TasksModule } from "./tasks/tasks.module";
import { AdminModule } from "./admin/admin.module";
import { FilesModule } from "./files/files.module";
import { StudentsModule } from "./students/students.module";
import { TelegramModule } from "./telegram/telegram.module";

// Entities
import { Company } from "./entities/company.entity";
import { User } from "./entities/user.entity";
import { Student } from "./entities/student.entity";
import { Country } from "./entities/country.entity";
import { Task } from "./entities/task.entity";
import { University } from "./entities/university.entity";
import { Program } from "./entities/program.entity";
import { TaskTemplate } from "./entities/task-template.entity";
import { Curator } from "./entities/curator.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Company, User, Student, Country, Task, University, Program, TaskTemplate, Curator],
      synchronize: true, // Внимание: только для разработки. В проде используйте миграции.
      autoLoadEntities: true,
    }),
    CamundaModule,
    AuthModule,
    CountriesModule,
    TasksModule,
    AdminModule,
    FilesModule,
    StudentsModule,
    TelegramModule,
  ],
})
export class AppModule { }
