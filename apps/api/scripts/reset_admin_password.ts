
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

const hashPassword = (pwd: string) => `hashed_${pwd}`;

async function run() {
    try {
        await AppDataSource.initialize();
        const userRepo = AppDataSource.getRepository(User);

        const adminEmail = 'admin@gmail.com';
        const newPass = 'admin123';

        let admin = await userRepo.findOne({ where: { email: adminEmail } });

        if (admin) {
            admin.passwordHash = hashPassword(newPass);
            await userRepo.save(admin);
            console.log(`Updated password for ${adminEmail} to ${newPass}`);
        } else {
            console.log(`User ${adminEmail} not found.`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    }
}
run();
