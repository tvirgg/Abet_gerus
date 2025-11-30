 import { Module } from "@nestjs/common";
 import { HttpModule } from "@nestjs/axios";
 import { CamundaService } from "./camunda.service";
 import { CamundaController } from "./camunda.controller";

 @Module({
   imports: [HttpModule],
   providers: [CamundaService],
   controllers: [CamundaController],
   exports: [CamundaService],
 })
export class CamundaModule {}
