import { DataSource } from 'typeorm';
import { Company } from './entities/company.entity';
import { Country } from './entities/country.entity';
import { User } from './entities/user.entity';
import { Student } from './entities/student.entity';
import { Task } from './entities/task.entity';
import { University } from './entities/university.entity';
import { Program } from './entities/program.entity';
import { TaskTemplate } from './entities/task-template.entity';
import { Curator } from './entities/curator.entity';
import { Role } from './entities/enums'; // Импортируем Role
import "dotenv/config";

const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [Company, Country, User, Student, Task, University, Program, TaskTemplate, Curator],
    synchronize: true,
});

// Простая функция хеширования для сида (должна совпадать с auth.service logic)
const hashPassword = (pwd: string) => `hashed_${pwd}`;

async function seed() {
    await AppDataSource.initialize();
    console.log("Database connected for seeding...");

    // 1. Company
    const companyRepo = AppDataSource.getRepository(Company);
    let company = await companyRepo.findOne({ where: { name: "Abbit Agency" } });
    if (!company) {
        company = companyRepo.create({ name: "Abbit Agency", config: { theme: "default" } });
        await companyRepo.save(company);
        console.log("✅ Company created");
    }

    // 2. Countries
    const countryRepo = AppDataSource.getRepository(Country);
    const countriesData = [
        { id: 'at', name: 'Австрия', flagIcon: '🇦🇹' },
        { id: 'it', name: 'Италия', flagIcon: '🇮🇹' },
        { id: 'de', name: 'Германия', flagIcon: '🇩🇪' },
        { id: 'us', name: 'США', flagIcon: '🇺🇸' },
        { id: 'uk', name: 'Великобритания', flagIcon: '🇬🇧' },
        { id: 'fr', name: 'Франция', flagIcon: '🇫🇷' },
        { id: 'nl', name: 'Нидерланды', flagIcon: '🇳🇱' },
    ];

    for (const c of countriesData) {
        const existing = await countryRepo.findOneBy({ id: c.id });
        if (!existing) await countryRepo.save(c);
    }
    console.log("✅ Countries seeded");

    // 3. Universities & Programs
    const uniRepo = AppDataSource.getRepository(University);
    const progRepo = AppDataSource.getRepository(Program);

    // ... (код создания университетов оставляем как был) ...
    const universitiesData = [
        {
            countryId: 'at',
            name: 'University of Vienna',
            logoUrl: '🏛️',
            programs: [
                { category: 'Business', title: 'Business Administration (BSc)', deadline: '2026-05-01', link: 'https://studieren.univie.ac.at/en', imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800' },
                { category: 'IT', title: 'Computer Science (MSc)', deadline: '2026-04-15', link: 'https://informatik.univie.ac.at/en/', imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800' }
            ]
        },
        // ... остальные университеты (для краткости пропущены, используйте свой массив)
        {
            countryId: 'it',
            name: 'University of Bologna',
            logoUrl: '🎓',
            programs: [
                { category: 'Science', title: 'Genomics (BSc)', deadline: '2026-04-10', link: 'https://www.unibo.it/en', imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800' },
            ]
        },
    ];

    // Сохраняем программы в массив, чтобы потом получить их ID
    const createdPrograms: Program[] = [];

    for (const uData of universitiesData) {
        let uni = await uniRepo.findOne({ where: { name: uData.name } });
        if (!uni) {
            uni = uniRepo.create({
                name: uData.name,
                countryId: uData.countryId,
                logoUrl: uData.logoUrl
            });
            await uniRepo.save(uni);
        }

        for (const pData of uData.programs) {
            let prog = await progRepo.findOne({ where: { title: pData.title, universityId: uni.id } });
            if (!prog) {
                prog = progRepo.create({
                    universityId: uni.id,
                    title: pData.title,
                    category: pData.category,
                    deadline: pData.deadline,
                    link: pData.link,
                    imageUrl: pData.imageUrl
                });
                await progRepo.save(prog);
            } else {
                prog.category = pData.category;
                await progRepo.save(prog);
            }
            createdPrograms.push(prog);
        }
    }
    console.log("✅ Universities & Programs seeded");


    // =========================================================
    // 4. Users & Students (ДОБАВЛЕНО)
    // =========================================================
    
    const userRepo = AppDataSource.getRepository(User);
    const studentRepo = AppDataSource.getRepository(Student);
    const curatorRepo = AppDataSource.getRepository(Curator);

    // 4.1 Создаем Куратора
    const curatorEmail = "curator@abbit.com";
    let curatorUser = await userRepo.findOne({ where: { email: curatorEmail } });
    
    if (!curatorUser) {
        curatorUser = userRepo.create({
            companyId: company.id,
            email: curatorEmail,
            passwordHash: hashPassword("admin123"),
            role: Role.CURATOR,
            isActive: true
        });
        await userRepo.save(curatorUser);

        const curator = curatorRepo.create({
            companyId: company.id,
            userId: curatorUser.id,
            fullName: "Анна Куратор",
            specialization: "Австрия и Германия",
            avatarUrl: ""
        });
        await curatorRepo.save(curator);
        console.log("✅ Curator created");
    }
    
    // Получаем сущность куратора для привязки
    const curator = await curatorRepo.findOne({ where: { userId: curatorUser.id } });

    // 4.2 Создаем Студента
    const studentEmail = "student@example.com";
    let studentUser = await userRepo.findOne({ where: { email: studentEmail } });

    if (!studentUser) {
        studentUser = userRepo.create({
            companyId: company.id,
            email: studentEmail,
            passwordHash: hashPassword("12345678"),
            role: Role.STUDENT,
            isActive: true
        });
        await userRepo.save(studentUser);

        // Находим пару программ для присвоения студенту (например, первые две)
        const programsToAssign = createdPrograms.slice(0, 2).map(p => p.id);

        const student = studentRepo.create({
            companyId: company.id,
            userId: studentUser.id,
            fullName: "Иван Иванов",
            countryId: 'at', // Австрия
            bindingCode: "S-1000",
            curatorId: curator?.id, // Привязываем к куратору
            selectedProgramIds: programsToAssign, // <--- ВОТ ЗДЕСЬ ДОБАВЛЯЕМ ПРОГРАММЫ
            xpTotal: 150
        });
        await studentRepo.save(student);
        console.log(`✅ Student created with ${programsToAssign.length} programs`);
    }

    console.log("✅ Seeding complete!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seeding error", err);
    process.exit(1);
});