"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CamundaService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let CamundaService = class CamundaService {
    constructor(http) {
        this.http = http;
        this.baseUrl = process.env.CAMUNDA_URL || "http://localhost:8080/engine-rest";
    }
    async getProcessDefinitions() {
        const url = `${this.baseUrl}/process-definition`;
        const res = await (0, rxjs_1.firstValueFrom)(this.http.get(url));
        return res.data;
    }
    async startProcessByKey(key, variables = {}) {
        const url = `${this.baseUrl}/process-definition/key/${key}/start`;
        const payload = {
            variables: Object.fromEntries(Object.entries(variables).map(([k, v]) => [
                k,
                { value: v, type: typeof v === "number" ? "Long" : "String" },
            ])),
        };
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.http.post(url, payload));
            return res.data;
        }
        catch (error) {
            console.error("❌ ОШИБКА CAMUNDA:", error.message, error.code);
            if (error.response) {
                console.error("Детали ответа:", error.response.data);
                throw new common_1.HttpException(error.response.data.message || "Ошибка внутри Camunda", error.response.status);
            }
            throw new common_1.HttpException("Не удалось подключиться к Camunda. Убедитесь, что она запущена на порту 8080.", common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    async sendMessage(messageName, businessKey, variables = {}) {
        const url = `${this.baseUrl}/message`;
        const payload = {
            messageName,
            businessKey,
            processVariables: Object.fromEntries(Object.entries(variables).map(([k, v]) => [
                k,
                { value: v, type: typeof v === "number" ? "Long" : "String" },
            ])),
        };
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.http.post(url, payload));
            return res.data;
        }
        catch (error) {
            console.error("❌ CAMUNDA MESSAGE ERROR:", error.message);
            return null;
        }
    }
};
exports.CamundaService = CamundaService;
exports.CamundaService = CamundaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], CamundaService);
