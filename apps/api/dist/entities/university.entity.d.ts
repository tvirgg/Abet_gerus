import { Country } from './country.entity';
import { Program } from './program.entity';
export declare class University {
    id: string;
    countryId: string;
    country: Country;
    name: string;
    logoUrl?: string;
    programs: Program[];
}
