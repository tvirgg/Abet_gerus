import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramService } from './telegram.service';
import { Student } from '../entities/student.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Student])],
    providers: [TelegramService],
    exports: [TelegramService],
})
export class TelegramModule { }
