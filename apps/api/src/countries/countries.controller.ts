import { Controller, Get } from "@nestjs/common";
import { CountriesService } from "./countries.service";

@Controller("countries")
export class CountriesController {
  constructor(private readonly service: CountriesService) {}

  @Get()
  getAll() {
    return this.service.findAll();
  }
}
