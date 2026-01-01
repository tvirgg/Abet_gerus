"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const typeorm_1 = require("@nestjs/typeorm");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const camunda_module_1 = require("../camunda/camunda.module");
const jwt_strategy_1 = require("./jwt.strategy");
const tasks_module_1 = require("../tasks/tasks.module");
const user_entity_1 = require("../entities/user.entity");
const student_entity_1 = require("../entities/student.entity");
const company_entity_1 = require("../entities/company.entity");
const country_entity_1 = require("../entities/country.entity");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            camunda_module_1.CamundaModule,
            passport_1.PassportModule,
            tasks_module_1.TasksModule,
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, student_entity_1.Student, company_entity_1.Company, country_entity_1.Country]),
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || "dev_secret_key",
                signOptions: { expiresIn: "7d" },
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, jwt_strategy_1.JwtStrategy],
    })
], AuthModule);
