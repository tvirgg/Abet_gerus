
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DocumentTemplate } from '../entities/document-template.entity';
import { StudentDocument } from '../entities/student-document.entity';
import { Student } from '../entities/student.entity';
import { FilesModule } from '../files/files.module';

import { CamundaModule } from '../camunda/camunda.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([DocumentTemplate, StudentDocument, Student]),
        FilesModule,
        CamundaModule,
    ],
    controllers: [DocumentsController],
    providers: [DocumentsService],
})
export class DocumentsModule { }
