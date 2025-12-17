import { Body, Controller, Get, Param, Post, Request, UseGuards } from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SubmitTaskDto } from "./dto/submit-task.dto";
import { RejectTaskDto } from "./dto/approve-task.dto";

@Controller()
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get("student/tasks")
  getMyTasks(@Request() req: any) {
    return this.tasksService.findAllForUser(req.user.userId);
  }

  @Post("student/tasks/:id/submit")
  submitTask(@Param("id") id: string, @Body() body: SubmitTaskDto) {
    return this.tasksService.submitTask(id, body.submission);
  }

  @Get("curator/review")
  getReviewQueue(@Request() req: any) {
    return this.tasksService.getReviewQueue();
  }

  @Post("curator/tasks/:id/approve")
  approveTask(@Param("id") id: string) {
    return this.tasksService.approveTask(id);
  }

  @Post("curator/tasks/:id/request-changes")
  requestChanges(@Param("id") id: string, @Body() body: RejectTaskDto) {
    return this.tasksService.requestChanges(id, body.comment);
  }

  @Get("curator/students/:studentId/tasks")
  getStudentTasks(@Param("studentId") studentId: string) {
    return this.tasksService.findAllForStudentEntity(studentId);
  }

  // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
  @Post("debug/generate")
  generate(@Request() req: any) {
      // Используем новый метод syncTasksForUser вместо удаленного generateInitialTasks
      return this.tasksService.syncTasksForUser(req.user.userId);
  }
  // -------------------------
}
