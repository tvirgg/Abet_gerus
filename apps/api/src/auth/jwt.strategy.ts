import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "dev_secret_key",
    });
  }

  async validate(payload: any) {
    // payload = { sub: userId, email: ..., role: ... }
    return { userId: payload.sub, email: payload.email, role: payload.role, companyId: payload.companyId };
  }
}
