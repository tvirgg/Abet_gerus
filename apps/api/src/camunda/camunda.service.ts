import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class CamundaService {
  private readonly baseUrl: string;

  constructor(private readonly http: HttpService) {
    // FIX: Если запускаем локально (без Docker), используем localhost
    // В docker-compose переменная CAMUNDA_URL перезапишет это на http://camunda:8080...
    this.baseUrl = process.env.CAMUNDA_URL || "http://localhost:8080/engine-rest";
  }

  async getProcessDefinitions() {
    const url = `${this.baseUrl}/process-definition`;
    const res = await firstValueFrom(this.http.get(url));
    return res.data;
  }

  async startProcessByKey(key: string, variables: Record<string, any> = {}) {
    const url = `${this.baseUrl}/process-definition/key/${key}/start`;
    const payload = {
      variables: Object.fromEntries(
        Object.entries(variables).map(([k, v]) => [
          k,
          { value: v, type: typeof v === "number" ? "Long" : "String" },
        ])
      ),
    };
    try {
      const res = await firstValueFrom(this.http.post(url, payload));
      return res.data;
    } catch (error: any) {
      // Логируем реальную причину ошибки в консоль сервера
      console.error("❌ ОШИБКА CAMUNDA:", error.message, error.code);

      if (error.response) {
        // Если Camunda ответила ошибкой (например, 404 Process definition not found)
        console.error("Детали ответа:", error.response.data);
        throw new HttpException(
          error.response.data.message || "Ошибка внутри Camunda",
          error.response.status
        );
      }

      // Если Camunda вообще недоступна (Connection refused)
      throw new HttpException(
        "Не удалось подключиться к Camunda. Убедитесь, что она запущена на порту 8080.",
        HttpStatus.BAD_GATEWAY
      );
    }
  }
}
