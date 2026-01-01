
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity';
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
        const userRepo = AppDataSource.getRepository(User);
        const users = await userRepo.find();
        console.log('Existing Users:');
        users.forEach(u => {
            console.log(`- Email: ${u.email}, Role: ${u.role}, ID: ${u.id}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    }
}
run();
