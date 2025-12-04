import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CamundaModule } from "./camunda/camunda.module";
import { AuthModule } from "./auth/auth.module";
import { CountriesModule } from "./countries/countries.module";
import { TasksModule } from "./tasks/tasks.module";
import { AdminModule } from "./admin/admin.module";

// Entities
import { Company } from "./entities/company.entity";
import { User } from "./entities/user.entity";
import { Student } from "./entities/student.entity";
import { Country } from "./entities/country.entity";
import { Task } from "./entities/task.entity";
import { University } from "./entities/university.entity";
import { Program } from "./entities/program.entity";
import { TaskTemplate } from "./entities/task-template.entity";

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Company, User, Student, Country, Task, University, Program, TaskTemplate],
      synchronize: true, // Внимание: только для разработки. В проде используйте миграции.
      autoLoadEntities: true,
    }),
    CamundaModule,
    AuthModule,
    CountriesModule,
    TasksModule,
    AdminModule,
  ],
})
export class AppModule {}
