import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { CamundaService } from "./camunda.service";

@Controller("camunda")
export class CamundaController {
  constructor(private readonly camunda: CamundaService) {}

  @Get("process-definitions")
  getDefs() {
    return this.camunda.getProcessDefinitions();
  }

  @Post("start")
  start(@Query("key") key: string, @Body() body: Record<string, any>) {
    if (!key) {
      throw new Error("Query param ?key=PROCESS_KEY is required");
    }
    return this.camunda.startProcessByKey(key, body || {});
  }
}
