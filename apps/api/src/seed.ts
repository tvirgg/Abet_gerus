import { DataSource } from 'typeorm';
import { Company } from './entities/company.entity';
import { Country } from './entities/country.entity';
import { User } from './entities/user.entity';
import { Student } from './entities/student.entity';
import { Task } from './entities/task.entity';
import { University } from './entities/university.entity';
import { Program } from './entities/program.entity';
import { TaskTemplate } from './entities/task-template.entity';
import "dotenv/config";

const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    // Важно добавить все сущности, которые связаны друг с другом,
    // даже если мы создаем только Company. TypeORM проверяет связи при инициализации.
    entities: [Company, Country, User, Student, Task, University, Program, TaskTemplate],
    synchronize: false, 
});
