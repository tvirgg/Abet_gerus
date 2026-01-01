export class RegisterDto {
  // обязательное поле, но инициализируем его уже на уровне Nest (body),
  // поэтому ставим "!" чтобы заткнуть strictPropertyInitialization
  email!: string;
  password?: string;
  fullName?: string;
  countryId?: string; // Deprecated: for backward compatibility
  countryIds?: string[]; // NEW: Multi-country support
  role?: "student" | "curator" | "admin";
}
