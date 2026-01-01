import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

// Simple migration runner for multi-country feature
async function runMigration() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'abiturient',
    });

    try {
        await dataSource.initialize();
        console.log('✅ Connected to database');

        const migrationSQL = fs.readFileSync(
            path.join(__dirname, '../migrations/001-add-student-countries-relation.sql'),
            'utf-8'
        );

        console.log('🔄 Running migration: AddStudentCountriesRelation');
        await dataSource.query(migrationSQL);
        console.log('✅ Migration completed successfully!');

        await dataSource.destroy();
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
