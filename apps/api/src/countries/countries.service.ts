import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Country } from "../entities/country.entity";

@Injectable()
export class CountriesService {
  constructor(
    @InjectRepository(Country) private countryRepo: Repository<Country>
  ) {}

  async findAll() {
    return this.countryRepo.find({
        order: { name: 'ASC' }
    });
  }
}
