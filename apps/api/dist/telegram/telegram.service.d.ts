import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Student } from '../entities/student.entity';
export declare class TelegramService implements OnModuleInit {
    private readonly studentRepository;
    private bot;
    private readonly logger;
    constructor(studentRepository: Repository<Student>);
    onModuleInit(): void;
    private initializeHandlers;
    private linkGroup;
    sendNotification(studentId: string, message: string): Promise<void>;
}
