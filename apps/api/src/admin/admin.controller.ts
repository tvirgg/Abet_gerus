import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
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

  // --- Programs Endpoints (ВАЖНО: этот блок должен быть здесь) ---
  @Get("programs/search")
  searchPrograms(
    @Query("countryId") countryId?: string,
    @Query("universityId") universityId?: string,
    @Query("category") category?: string,
    @Query("search") search?: string
  ) {
    return this.adminService.searchPrograms({ countryId, universityId, category, search });
  }

  @Post("programs")
  createProgram(@Body() dto: any) {
    return this.adminService.createProgram(dto);
  }

  @Patch("programs/:id")
  updateProgram(@Param("id") id: string, @Body() dto: any) {
    return this.adminService.updateProgram(Number(id), dto);
  }

  @Delete("programs/:id")
  deleteProgram(@Param("id") id: string) {
    return this.adminService.deleteProgram(Number(id));
  }
  // -----------------------------------------------------------

  @Get("moderators")
  getModerators() {
    return this.adminService.getModerators();
  }

  @Post("moderators")
  createModerator(@Body() dto: any) {
    return this.adminService.createModerator(dto);
  }

  @Patch("moderators/:id")
  updateModerator(@Param("id") id: string, @Body() dto: any) {
    return this.adminService.updateModerator(id, dto);
  }

  @Get("students")
  getStudents() {
    return this.adminService.getStudents();
  }
  
  @Patch("users/:id/reset-password")
  resetPassword(@Param("id") id: string, @Body("password") password?: string) {
      return this.adminService.resetPassword(id, password);
  }
}
