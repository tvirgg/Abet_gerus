import { CountriesService } from "./countries.service";
export declare class CountriesController {
    private readonly service;
    constructor(service: CountriesService);
    getAll(): Promise<import("../entities/country.entity").Country[]>;
}
