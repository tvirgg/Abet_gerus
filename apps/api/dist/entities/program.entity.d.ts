import { University } from './university.entity';
export declare class Program {
    id: number;
    universityId: string;
    university: University;
    category?: string;
    title: string;
    deadline?: string;
    link?: string;
    imageUrl?: string;
    requiredDocumentIds: number[];
}
