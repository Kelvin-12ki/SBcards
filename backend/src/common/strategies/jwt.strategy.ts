import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;       // MongoDB user ID
  uid: string;       // Firebase UID
  email: string;
  role: string;      // User role
}

export interface JwtUser {
  uid: string;       // Firebase UID (compatible with FirebaseUser interface)
  email: string;
  userId: string;    // MongoDB user ID
  role: string;      // User role
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'fallback-secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    return {
      uid: payload.uid,
      email: payload.email,
      userId: payload.sub,
      role: payload.role,
    };
  }
}
