import { HttpService } from "@nestjs/axios";
export declare class CamundaService {
    private readonly http;
    private readonly baseUrl;
    constructor(http: HttpService);
    getProcessDefinitions(): Promise<any>;
    startProcessByKey(key: string, variables?: Record<string, any>): Promise<any>;
    sendMessage(messageName: string, businessKey?: string, variables?: Record<string, any>): Promise<any>;
}
