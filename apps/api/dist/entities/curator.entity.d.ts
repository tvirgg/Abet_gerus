import { User } from './user.entity';
export declare class Curator {
    id: string;
    companyId: string;
    userId: string;
    user: User;
    fullName?: string;
    specialization?: string;
    bio?: string;
    avatarUrl?: string;
}
