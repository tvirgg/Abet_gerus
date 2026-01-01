import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import TelegramBot from 'node-telegram-bot-api';
import { Student } from '../entities/student.entity';

@Injectable()
export class TelegramService implements OnModuleInit {
    private bot: TelegramBot | null = null;
    private readonly logger = new Logger(TelegramService.name);

    constructor(
        @InjectRepository(Student)
        private readonly studentRepository: Repository<Student>,
    ) { }

    onModuleInit() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            this.logger.warn('TELEGRAM_BOT_TOKEN not set. Telegram integration disabled.');
            return;
        }

        this.bot = new TelegramBot(token, { polling: true });
        this.logger.log('Telegram Bot initialized');

        this.initializeHandlers();
    }

    private initializeHandlers() {
        if (!this.bot) return;

        // Handle /link command
        this.bot.onText(/\/link (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const bindingCode = match ? match[1] : null;

            if (!bindingCode) {
                this.bot?.sendMessage(chatId, 'Пожалуйста, укажите код привязки: /link S-XXXX');
                return;
            }

            try {
                await this.linkGroup(chatId, bindingCode);
            } catch (error) {
                this.logger.error(`Error linking group: ${error}`);
                this.bot?.sendMessage(chatId, 'Произошла ошибка при привязке.');
            }
        });

        // Logging errors
        this.bot.on('polling_error', (error) => {
            this.logger.error(`Telegram Polling Error: ${error.message}`);
        });
    }

    private async linkGroup(chatId: number, bindingCode: string) {
        if (!this.bot) return;

        this.logger.log(`Attempting to link chat ${chatId} with code ${bindingCode}`);

        const student = await this.studentRepository.findOne({ where: { bindingCode } });

        if (!student) {
            this.bot.sendMessage(chatId, '❌ Студент с таким кодом не найден. Проверьте правильность ввода.');
            return;
        }

        if (student.telegramGroupId) {
            this.bot.sendMessage(chatId, '⚠️ Этот студент уже привязан к Telegram-группе.');
            return;
        }

        // Update student
        student.telegramGroupId = chatId.toString();
        await this.studentRepository.save(student);

        this.bot.sendMessage(chatId, `✅ Группа успешно подключена к профилю студента: ${student.fullName}. Ожидайте уведомлений.`);
        this.logger.log(`Linked student ${student.id} (S-${student.bindingCode}) to chat ${chatId}`);
    }

    // Method to send notification manually (for future use)
    public async sendNotification(studentId: string, message: string) {
        if (!this.bot) return;

        const student = await this.studentRepository.findOne({ where: { id: studentId } });
        if (!student || !student.telegramGroupId) {
            this.logger.warn(`Cannot send notification: Student ${studentId} has no telegram link.`);
            return;
        }

        try {
            await this.bot.sendMessage(student.telegramGroupId, message);
        } catch (e) {
            this.logger.error(`Failed to send telegram message: ${e}`);
        }
    }
}
