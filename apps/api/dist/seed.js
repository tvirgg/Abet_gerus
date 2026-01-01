"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const company_entity_1 = require("./entities/company.entity");
const country_entity_1 = require("./entities/country.entity");
const user_entity_1 = require("./entities/user.entity");
const student_entity_1 = require("./entities/student.entity");
const task_entity_1 = require("./entities/task.entity");
const university_entity_1 = require("./entities/university.entity");
const program_entity_1 = require("./entities/program.entity");
const task_template_entity_1 = require("./entities/task-template.entity");
const curator_entity_1 = require("./entities/curator.entity");
const document_template_entity_1 = require("./entities/document-template.entity");
const enums_1 = require("./entities/enums");
require("dotenv/config");
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [company_entity_1.Company, country_entity_1.Country, user_entity_1.User, student_entity_1.Student, task_entity_1.Task, university_entity_1.University, program_entity_1.Program, task_template_entity_1.TaskTemplate, curator_entity_1.Curator, document_template_entity_1.DocumentTemplate],
    synchronize: true,
});
const hashPassword = (pwd) => `hashed_${pwd}`;
async function seed() {
    await AppDataSource.initialize();
    console.log("Database connected for seeding...");
    const companyRepo = AppDataSource.getRepository(company_entity_1.Company);
    let company = await companyRepo.findOne({ where: { name: "Abbit Agency" } });
    if (!company) {
        company = companyRepo.create({ name: "Abbit Agency", config: { theme: "default" } });
        await companyRepo.save(company);
        console.log("✅ Company created");
    }
    const countryRepo = AppDataSource.getRepository(country_entity_1.Country);
    const countriesData = [
        {
            id: 'at',
            name: 'Австрия',
            flagIcon: '🇦🇹',
            requiredDocumentIds: [101, 102, 201, 202, 203]
        },
        { id: 'it', name: 'Италия', flagIcon: '🇮🇹', requiredDocumentIds: [] },
        { id: 'de', name: 'Германия', flagIcon: '🇩🇪', requiredDocumentIds: [] },
        { id: 'us', name: 'США', flagIcon: '🇺🇸', requiredDocumentIds: [] },
        { id: 'uk', name: 'Великобритания', flagIcon: '🇬🇧', requiredDocumentIds: [] },
        { id: 'fr', name: 'Франция', flagIcon: '🇫🇷', requiredDocumentIds: [] },
        { id: 'nl', name: 'Нидерланды', flagIcon: '🇳🇱', requiredDocumentIds: [] },
    ];
    for (const c of countriesData) {
        const existing = await countryRepo.findOneBy({ id: c.id });
        if (!existing)
            await countryRepo.save(c);
    }
    console.log("✅ Countries seeded");
    const uniRepo = AppDataSource.getRepository(university_entity_1.University);
    const progRepo = AppDataSource.getRepository(program_entity_1.Program);
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
            countryId: 'it',
            name: 'University of Bologna',
            logoUrl: '🎓',
            programs: [
                { category: 'Science', title: 'Genomics (BSc)', deadline: '2026-04-10', link: 'https://www.unibo.it/en', imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800' },
            ]
        },
    ];
    const createdPrograms = [];
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
            }
            else {
                prog.category = pData.category;
                await progRepo.save(prog);
            }
            createdPrograms.push(prog);
        }
    }
    console.log("✅ Universities & Programs seeded");
    const taskTplRepo = AppDataSource.getRepository(task_template_entity_1.TaskTemplate);
    const austriaTasks = [
        { countryId: 'at', title: "Загрузить скан загранпаспорта", stage: "Документы", xpReward: 20, description: "Загрузите PDF скан главной страницы паспорта." },
        { countryId: 'at', title: "Сделать фото для визы", stage: "Документы", xpReward: 15, description: "Фото 3.5х4.5 на белом фоне." },
        { countryId: 'at', title: "Перевести аттестат/диплом", stage: "Документы", xpReward: 50, description: "Нотариально заверенный перевод на английский или немецкий." },
        { countryId: 'at', title: "Выбрать программу обучения", stage: "Подготовка", xpReward: 10, description: "Изучите программы в австрийских университетах." },
        { countryId: 'at', title: "Написать мотивационное письмо", stage: "Творчество", xpReward: 60, description: "Черновик письма на немецком или английском." },
        { countryId: 'at', title: "Подать заявку на визу", stage: "Виза", xpReward: 100, description: "Запись в консульство Австрии." }
    ];
    const italyTasks = [
        { countryId: 'it', title: "Загрузить скан загранпаспорта", stage: "Документы", xpReward: 20, description: "Загрузите PDF скан главной страницы паспорта." },
        { countryId: 'it', title: "Сделать фото для визы", stage: "Документы", xpReward: 15, description: "Фото 3.5х4.5 на белом фоне." },
        { countryId: 'it', title: "Перевести аттестат/диплом", stage: "Документы", xpReward: 50, description: "Нотариально заверенный перевод на итальянский или английский." },
        { countryId: 'it', title: "Выбрать программу обучения", stage: "Подготовка", xpReward: 10, description: "Изучите программы в итальянских университетах." },
        { countryId: 'it', title: "Написать мотивационное письмо", stage: "Творчество", xpReward: 60, description: "Черновик письма на итальянском или английском." },
        { countryId: 'it', title: "Подать заявку на визу", stage: "Виза", xpReward: 100, description: "Запись в консульство Италии." }
    ];
    const allTaskTemplates = [...austriaTasks, ...italyTasks];
    for (const t of allTaskTemplates) {
        const existing = await taskTplRepo.findOne({
            where: { countryId: t.countryId, title: t.title }
        });
        if (!existing) {
            await taskTplRepo.save(taskTplRepo.create(t));
        }
    }
    console.log(`✅ TaskTemplates seeded: ${allTaskTemplates.length} templates`);
    const userRepo = AppDataSource.getRepository(user_entity_1.User);
    const studentRepo = AppDataSource.getRepository(student_entity_1.Student);
    const curatorRepo = AppDataSource.getRepository(curator_entity_1.Curator);
    const curatorEmail = "curator@abbit.com";
    let curatorUser = await userRepo.findOne({ where: { email: curatorEmail } });
    if (!curatorUser) {
        curatorUser = userRepo.create({
            companyId: company.id,
            email: curatorEmail,
            passwordHash: hashPassword("admin123"),
            role: enums_1.Role.CURATOR,
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
    const curator = await curatorRepo.findOne({ where: { userId: curatorUser.id } });
    const docTemplateRepo = AppDataSource.getRepository(document_template_entity_1.DocumentTemplate);
    const docTemplatesData = [
        {
            title: 'Скан Паспорта',
            step_order: 1,
            document_type: document_template_entity_1.DocumentType.PASSPORT,
            advice_text: 'Главный документ для зачисления и визы. Загрузите цветной скан или фото главного разворота загранпаспорта. Убедитесь, что нет бликов и видны все углы.',
            validation_rules: ['Читаемость всех зон (MRZ, ФИО, номер)', 'Отсутствие бликов', 'Видимость всех 4-х углов', 'Срок действия > 18 месяцев'],
            rejection_reasons: ['Скан обрезан', 'Текст не читаем', 'Истек срок действия']
        },
        {
            title: 'Справка с места учебы',
            step_order: 2,
            document_type: document_template_entity_1.DocumentType.EDUCATION,
            advice_text: 'Подтверждение того, что вы сейчас обучаетесь. Если справка не на английском, потребуется перевод.',
            validation_rules: ['Наличие "живой" печати', 'Наличие подписи', 'Свежая дата выдачи (< 3 мес)'],
            rejection_reasons: ['Справка устарела', 'Нет печати', 'Неверный формат']
        },
        {
            title: 'Апостиль диплома/аттестата',
            step_order: 2,
            document_type: document_template_entity_1.DocumentType.EDUCATION,
            advice_text: 'Оригинал диплома должен иметь штамп Апостиль (выдается Министерством образования). Срок: до 15 рабочих дней.',
            validation_rules: ['Наличие штампа "Apostille"', 'Читаемость печати', 'Целостность скрепления'],
            rejection_reasons: ['Нет штампа на обороте', 'Штамп не читаем']
        },
        {
            title: 'Нотариальный перевод',
            step_order: 3,
            document_type: document_template_entity_1.DocumentType.TRANSLATION,
            advice_text: 'Перевод документов на язык обучения (обычно английский). Загрузите скан перевода, сшитого с копией документа, заверенный нотариусом.',
            validation_rules: ['Подпись переводчика', 'Печать и подпись нотариуса', 'Сшито с копией'],
            rejection_reasons: ['Нет заверения нотариуса', 'Неполный документ']
        }
    ];
    for (const dt of docTemplatesData) {
        let t = await docTemplateRepo.findOne({ where: { title: dt.title } });
        if (!t) {
            t = docTemplateRepo.create(dt);
            await docTemplateRepo.save(t);
        }
    }
    console.log("✅ Document Templates seeded");
    const studentEmail = "student@example.com";
    let studentUser = await userRepo.findOne({ where: { email: studentEmail } });
    if (!studentUser) {
        studentUser = userRepo.create({
            companyId: company.id,
            email: studentEmail,
            passwordHash: hashPassword("12345678"),
            role: enums_1.Role.STUDENT,
            isActive: true
        });
        await userRepo.save(studentUser);
        const programsToAssign = createdPrograms.slice(0, 2).map(p => p.id);
        const student = studentRepo.create({
            companyId: company.id,
            userId: studentUser.id,
            fullName: "Иван Иванов",
            countryId: 'at',
            bindingCode: "S-1000",
            curatorId: curator?.id,
            selectedProgramIds: programsToAssign,
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
