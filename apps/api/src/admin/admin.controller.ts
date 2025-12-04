import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("admin")
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post("countries")
  createCountry(@Body() dto: any) {
    return this.adminService.createCountry(dto);
  }

  @Get("universities")
  getUniversities() {
    return this.adminService.getUniversities();
  }

  @Post("universities")
  createUniversity(@Body() dto: any) {
    return this.adminService.createUniversity(dto);
  }

  @Get("task-templates")
  getTaskTemplates() {
    return this.adminService.getTaskTemplates();
  }

  @Post("task-templates")
  createTaskTemplate(@Body() dto: any) {
    return this.adminService.createTaskTemplate(dto);
  }

  @Delete("task-templates/:id")
  deleteTaskTemplate(@Param("id") id: string) {
      return this.adminService.deleteTaskTemplate(Number(id));
  }
}
