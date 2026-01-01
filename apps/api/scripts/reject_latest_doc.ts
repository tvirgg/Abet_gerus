
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { StudentDocument, DocumentStatus } from '../src/entities/student-document.entity';
import { Student } from '../src/entities/student.entity';
import { DocumentTemplate } from '../src/entities/document-template.entity';
import * as path from 'path';

const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [
        path.join(__dirname, '../src/entities/*.entity.ts')
    ],
    synchronize: true,
});

async function run() {
    try {
        await AppDataSource.initialize();
        console.log('Data Source has been initialized!');

        const repo = AppDataSource.getRepository(StudentDocument);

        const [latestDoc] = await repo.find({
            order: { created_at: 'DESC' },
            relations: ['student', 'template'],
            take: 1
        });

        if (!latestDoc) {
            console.log('No documents found. Creating a mock document for testing...');

            const studentRepo = AppDataSource.getRepository(Student);
            const [student] = await studentRepo.find({ take: 1 });

            const tmplRepo = AppDataSource.getRepository(DocumentTemplate);
            const [tmpl] = await tmplRepo.find({ take: 1 });

            if (student && tmpl) {
                console.log(`Found student ${student.id} and template ${tmpl.id}`);
                const newDoc = new StudentDocument();
                newDoc.student = student;
                newDoc.template = tmpl;
                newDoc.status = DocumentStatus.REJECTED;
                newDoc.manager_comment = "Тестовый отказ: Качество скана слишком низкое. Пожалуйста, загрузите цветной скан в высоком разрешении, как указано в инструкции.";
                newDoc.minio_file_path = "mock/path/file.jpg";

                const saved = await repo.save(newDoc);
                console.log(`Created and rejected document ID: ${saved.id}`);
            } else {
                console.log('Cannot create mock: No student or template found.');
            }
        } else {
            latestDoc.status = DocumentStatus.REJECTED;
            latestDoc.manager_comment = "Тестовый отказ: Качество скана слишком низкое. Пожалуйста, загрузите цветной скан в высоком разрешении, как указано в инструкции.";

            await repo.save(latestDoc);
            console.log(`Updated document ID: ${latestDoc.id}`);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

run();
