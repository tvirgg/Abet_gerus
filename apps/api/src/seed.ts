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
import "dotenv/config";

const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [Company, Country, User, Student, Task, University, Program, TaskTemplate, Curator],
    synchronize: true, // Внимание: в проде используйте false и миграции
});

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

    // 3. Universities & Programs with Categories
    const uniRepo = AppDataSource.getRepository(University);
    const progRepo = AppDataSource.getRepository(Program);

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
        {
            countryId: 'at',
            name: 'TU Wien',
            logoUrl: '⚙️',
            programs: [
                { category: 'Arts/Design', title: 'Architecture (BSc)', deadline: '2026-03-01', link: 'https://www.tuwien.at/en/studies', imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800' },
                { category: 'IT', title: 'Data Science (MSc)', deadline: '2026-06-30', link: 'https://www.tuwien.at/en', imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800' },
                { category: 'Engineering', title: 'Mechanical Engineering (BSc)', deadline: '2026-07-15', link: 'https://www.tuwien.at', imageUrl: 'https://images.unsplash.com/photo-1537462713205-e512641bf201?w=800' }
            ]
        },
        {
            countryId: 'it',
            name: 'University of Bologna',
            logoUrl: '🎓',
            programs: [
                { category: 'Humanities', title: 'International Relations (MA)', deadline: '2026-05-20', link: 'https://www.unibo.it/en', imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800' },
                { category: 'Science', title: 'Genomics (BSc)', deadline: '2026-04-10', link: 'https://www.unibo.it/en', imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800' },
                { category: 'Law', title: 'Legal Studies (LLB)', deadline: '2026-05-05', link: 'https://www.unibo.it/en', imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800' }
            ]
        },
        {
            countryId: 'it',
            name: 'Politecnico di Milano',
            logoUrl: '🏗️',
            programs: [
                { category: 'Engineering', title: 'Mechanical Engineering (BSc)', deadline: '2026-07-15', link: 'https://www.polimi.it/en', imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800' },
                { category: 'Arts/Design', title: 'Design & Engineering (MSc)', deadline: '2026-02-28', link: 'https://www.polimi.it/en', imageUrl: 'https://images.unsplash.com/photo-1581093588401-fbb07363f552?w=800' },
                { category: 'Arts/Design', title: 'Fashion Design (BA)', deadline: '2026-04-10', link: 'https://www.polimi.it', imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800' }
            ]
        },
        {
            countryId: 'de',
            name: 'TU Munich',
            logoUrl: '🍺',
            programs: [
                { category: 'Engineering', title: 'Aerospace (BSc)', deadline: '2026-07-15', link: 'https://www.tum.de/en/', imageUrl: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800' },
                { category: 'IT', title: 'Robotics (MSc)', deadline: '2026-05-31', link: 'https://www.tum.de/en/', imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800' },
                { category: 'Business', title: 'Management & Technology (BSc)', deadline: '2026-07-15', link: 'https://www.tum.de/en/', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800' }
            ]
        },
        {
            countryId: 'us',
            name: 'MIT',
            logoUrl: '🚀',
            programs: [
                { category: 'IT', title: 'Computer Science (BSc)', deadline: '2026-01-01', link: 'https://www.mit.edu/', imageUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800' },
                { category: 'Arts/Design', title: 'Media Arts (MSc)', deadline: '2025-12-15', link: 'https://www.media.mit.edu/', imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800' },
                { category: 'Engineering', title: 'Nuclear Science (PhD)', deadline: '2025-12-15', link: 'https://www.mit.edu', imageUrl: 'https://images.unsplash.com/photo-1574352067721-72d5913ef8e1?w=800' }
            ]
        },
        {
            countryId: 'us',
            name: 'Stanford University',
            logoUrl: '🌲',
            programs: [
                { category: 'Business', title: 'MBA', deadline: '2025-09-10', link: 'https://www.stanford.edu/', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800' },
                { category: 'IT', title: 'Symbolic Systems (BSc)', deadline: '2026-01-05', link: 'https://www.stanford.edu/', imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800' }
            ]
        },
        {
            countryId: 'uk',
            name: 'University of Oxford',
            logoUrl: '📚',
            programs: [
                { category: 'Law', title: 'Law (BA)', deadline: '2025-10-15', link: 'https://www.ox.ac.uk/', imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800' },
                { category: 'Business', title: 'Financial Economics (MSc)', deadline: '2026-01-08', link: 'https://www.ox.ac.uk/', imageUrl: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?w=800' },
                { category: 'Humanities', title: 'Philosophy, Politics and Economics (BA)', deadline: '2025-10-15', link: 'https://www.ox.ac.uk', imageUrl: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=800' }
            ]
        },
        {
            countryId: 'fr',
            name: 'Sorbonne University',
            logoUrl: '⚜️',
            programs: [
                { category: 'Humanities', title: 'History of Art (Licence)', deadline: '2026-04-01', link: 'https://www.sorbonne-universite.fr/en', imageUrl: 'https://images.unsplash.com/photo-1565060169123-e99d9841f237?w=800' },
                { category: 'Science', title: 'Physics (Master)', deadline: '2026-03-15', link: 'https://www.sorbonne-universite.fr', imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800' }
            ]
        },
        {
            countryId: 'nl',
            name: 'TU Delft',
            logoUrl: '🚲',
            programs: [
                { category: 'Arts/Design', title: 'Industrial Design Engineering (MSc)', deadline: '2026-04-01', link: 'https://www.tudelft.nl', imageUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800' },
                { category: 'Engineering', title: 'Aerospace Engineering (BSc)', deadline: '2026-01-15', link: 'https://www.tudelft.nl', imageUrl: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800' }
            ]
        }
    ];

    for (const uData of universitiesData) {
        let uni = await uniRepo.findOne({ where: { name: uData.name } });
        if (!uni) {
            uni = uniRepo.create({
                name: uData.name,
                countryId: uData.countryId,
                logoUrl: uData.logoUrl
            });
            await uniRepo.save(uni);
            console.log(`Created university: ${uni.name}`);
        }

        for (const pData of uData.programs) {
            const progExists = await progRepo.findOne({ where: { title: pData.title, universityId: uni.id } });
            if (!progExists) {
                const prog = progRepo.create({
                    universityId: uni.id,
                    title: pData.title,
                    category: pData.category,
                    deadline: pData.deadline,
                    link: pData.link,
                    imageUrl: pData.imageUrl
                });
                await progRepo.save(prog);
                console.log(`  -> Added program: [${pData.category}] ${pData.title}`);
            } else {
                // Обновляем категорию для существующих записей
                progExists.category = pData.category;
                await progRepo.save(progExists);
            }
        }
    }

    console.log("✅ Seeding complete with Categories!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seeding error", err);
    process.exit(1);
});
