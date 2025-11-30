import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable aggressive CORS for development
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  
  app.setGlobalPrefix("api");

  await app.listen(4000);
  console.log("API listening on http://localhost:4000/api");
}
bootstrap();
