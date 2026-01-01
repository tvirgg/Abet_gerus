"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TelegramService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const student_entity_1 = require("../entities/student.entity");
let TelegramService = TelegramService_1 = class TelegramService {
    constructor(studentRepository) {
        this.studentRepository = studentRepository;
        this.bot = null;
        this.logger = new common_1.Logger(TelegramService_1.name);
    }
    onModuleInit() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            this.logger.warn('TELEGRAM_BOT_TOKEN not set. Telegram integration disabled.');
            return;
        }
        this.bot = new node_telegram_bot_api_1.default(token, { polling: true });
        this.logger.log('Telegram Bot initialized');
        this.initializeHandlers();
    }
    initializeHandlers() {
        if (!this.bot)
            return;
        this.bot.onText(/\/link (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const bindingCode = match ? match[1] : null;
            if (!bindingCode) {
                this.bot?.sendMessage(chatId, 'Пожалуйста, укажите код привязки: /link S-XXXX');
                return;
            }
            try {
                await this.linkGroup(chatId, bindingCode);
            }
            catch (error) {
                this.logger.error(`Error linking group: ${error}`);
                this.bot?.sendMessage(chatId, 'Произошла ошибка при привязке.');
            }
        });
        this.bot.on('polling_error', (error) => {
            this.logger.error(`Telegram Polling Error: ${error.message}`);
        });
    }
    async linkGroup(chatId, bindingCode) {
        if (!this.bot)
            return;
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
        student.telegramGroupId = chatId.toString();
        await this.studentRepository.save(student);
        this.bot.sendMessage(chatId, `✅ Группа успешно подключена к профилю студента: ${student.fullName}. Ожидайте уведомлений.`);
        this.logger.log(`Linked student ${student.id} (S-${student.bindingCode}) to chat ${chatId}`);
    }
    async sendNotification(studentId, message) {
        if (!this.bot)
            return;
        const student = await this.studentRepository.findOne({ where: { id: studentId } });
        if (!student || !student.telegramGroupId) {
            this.logger.warn(`Cannot send notification: Student ${studentId} has no telegram link.`);
            return;
        }
        try {
            await this.bot.sendMessage(student.telegramGroupId, message);
        }
        catch (e) {
            this.logger.error(`Failed to send telegram message: ${e}`);
        }
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = TelegramService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TelegramService);
