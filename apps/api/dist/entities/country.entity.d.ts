import { University } from './university.entity';
import { Student } from './student.entity';
export declare class Country {
    id: string;
    name: string;
    flagIcon: string;
    requiredDocumentIds: number[];
    students: Student[];
    universities: University[];
}
