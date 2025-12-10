import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.studentsService.getStudent(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.studentsService.updateProfile(id, body);
  }
}
