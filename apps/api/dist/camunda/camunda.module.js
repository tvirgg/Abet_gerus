"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CamundaModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const camunda_service_1 = require("./camunda.service");
const camunda_controller_1 = require("./camunda.controller");
let CamundaModule = class CamundaModule {
};
exports.CamundaModule = CamundaModule;
exports.CamundaModule = CamundaModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule],
        providers: [camunda_service_1.CamundaService],
        controllers: [camunda_controller_1.CamundaController],
        exports: [camunda_service_1.CamundaService],
    })
], CamundaModule);
