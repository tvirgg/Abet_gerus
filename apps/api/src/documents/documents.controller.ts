
import { Controller, Get, Post, Patch, Body, Param, UploadedFile, UseInterceptors, UseGuards, Req, BadRequestException, ForbiddenException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { DocumentsService } from './documents.service';
import { DocumentStatus } from '../entities/student-document.entity';

@Controller('documents')
@UseGuards(AuthGuard('jwt'))
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    @Get('requirements')
    async getRequirements(@Req() req: any) {
        // req.user contains the user from JWT
        const userId = req.user.id;
        return await this.documentsService.getRequirements(userId);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadDocument(
        @Req() req: any,
        @UploadedFile() file: Express.Multer.File,
        @Body('template_id') templateIdStr: string,
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        if (!templateIdStr) {
            throw new BadRequestException('Template ID is required');
        }

        const userId = req.user.id;
        const templateId = parseInt(templateIdStr, 10);

        // Call service
        return await this.documentsService.uploadDocument(userId, templateId, file);
    }

    @Get('pending')
    async getPendingDocuments(@Req() req: any) {
        const user = req.user;
        // Check for curator or admin (handling potential case sensitivity or strict enum usage)
        const role = user.role?.toUpperCase();
        if (role !== 'CURATOR' && role !== 'ADMIN' && user.role !== 'curator' && user.role !== 'admin') {
            throw new ForbiddenException('Access denied');
        }
        return await this.documentsService.getPendingDocuments();
    }


    @Patch(':documentId/review')
    async reviewDocument(
        @Param('documentId') documentId: string,
        @Body() body: { status: DocumentStatus; comment?: string },
    ) {
        if (!body.status) {
            throw new BadRequestException('Status is required');
        }
        return await this.documentsService.reviewDocument(documentId, body.status, body.comment);
    }
}
