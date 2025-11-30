import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CountriesService } from "./countries.service";
import { CountriesController } from "./countries.controller";
import { Country } from "../entities/country.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Country])],
  providers: [CountriesService],
  controllers: [CountriesController],
})
export class CountriesModule {}
