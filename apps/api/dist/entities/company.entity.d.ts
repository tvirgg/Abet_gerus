import { User } from './user.entity';
export declare class Company {
    id: string;
    name: string;
    config: Record<string, any>;
    isArchived: boolean;
    users: User[];
}
