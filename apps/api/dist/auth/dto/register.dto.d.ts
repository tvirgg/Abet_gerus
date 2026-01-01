export declare class RegisterDto {
    email: string;
    password?: string;
    fullName?: string;
    countryId?: string;
    countryIds?: string[];
    role?: "student" | "curator" | "admin";
}
