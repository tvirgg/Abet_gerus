import { Repository } from "typeorm";
import { Country } from "../entities/country.entity";
export declare class CountriesService {
    private countryRepo;
    constructor(countryRepo: Repository<Country>);
    findAll(): Promise<Country[]>;
}
