import { Body, Controller, Get, Param, Post, Request, UseGuards } from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SubmitTaskDto } from "./dto/submit-task.dto";
import { RejectTaskDto } from "./dto/approve-task.dto";

@Controller() // Корневой путь контроллера будет динамическим
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // --- Student Endpoints ---
  
  @Get("student/tasks")
  getMyTasks(@Request() req: any) {
    // req.user.userId -> User.id. Нам нужен Student.id?
    // В нашей схеме User.id === Student.userId. Найдем студента по userId.
    return this.tasksService.findAllForUser(req.user.userId);
  }

  @Post("student/tasks/:id/submit")
  submitTask(@Param("id") id: string, @Body() body: SubmitTaskDto) {
    return this.tasksService.submitTask(id, body.submission);
  }

  // --- Curator Endpoints ---

  @Get("curator/review")
  getReviewQueue(@Request() req: any) {
    // req.user.companyId используется для фильтрации (пока хардкод)
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

  @Post("debug/generate")
  generate(@Request() req: any) {
      return this.tasksService.generateInitialTasks(req.user.userId, 'at');
  }
}
