import { CamundaService } from "./camunda.service";
export declare class CamundaController {
    private readonly camunda;
    constructor(camunda: CamundaService);
    getDefs(): Promise<any>;
    start(key: string, body: Record<string, any>): Promise<any>;
}
