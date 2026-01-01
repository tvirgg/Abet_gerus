import { Company } from './company.entity';
import { Student } from './student.entity';
import { Curator } from './curator.entity';
import { Role } from './enums';
export declare class User {
    id: string;
    companyId: string;
    company: Company;
    email: string;
    passwordHash: string;
    role: Role;
    isActive: boolean;
    createdAt: Date;
    student?: Student;
    curator?: Curator;
}
