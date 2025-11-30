import { DataSource } from 'typeorm';
import { Company } from './entities/company.entity';
import { Country } from './entities/country.entity';
import { User } from './entities/user.entity';
import { Student } from './entities/student.entity';
import { Task } from './entities/task.entity';
import "dotenv/config";

const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    // Важно добавить все сущности, которые связаны друг с другом,
    // даже если мы создаем только Company. TypeORM проверяет связи при инициализации.
    entities: [Company, Country, User, Student, Task],
    synchronize: false, 
});

async function seed() {
    await AppDataSource.initialize();
    console.log("Seeding started...");

    const companyRepo = AppDataSource.getRepository(Company);
    const countryRepo = AppDataSource.getRepository(Country);

    // Используем валидный UUID вместо простого текста
    const COMPANY_ID = '123e4567-e89b-12d3-a456-426614174000';

    // 1. Default Company
    const existingCompany = await companyRepo.findOneBy({ id: COMPANY_ID });
    if (!existingCompany) {
        await companyRepo.save({
            id: COMPANY_ID,
            name: 'Gerus Labs',
            config: { theme: 'dark' }
        });
        console.log("Created Company");
    }

    // 2. Countries
    const countries = [
        { id: 'at', name: 'Австрия', flagIcon: '🇦🇹' },
        { id: 'it', name: 'Италия', flagIcon: '🇮🇹' },
    ];

    for (const c of countries) {
        const exists = await countryRepo.findOneBy({ id: c.id });
        if (!exists) {
            await countryRepo.save(c);
        }
    }
    console.log("Created Countries");

    await AppDataSource.destroy();
}

seed().catch(console.error);
