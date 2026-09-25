import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  sid: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: { cookies?: Record<string, string>; headers?: { cookie?: string } } | undefined): string | null => {
          let token: string | null = null;
          if (req?.cookies && typeof req.cookies['saar_session'] === 'string') {
            token = req.cookies['saar_session'];
          }
          if (!token && typeof req?.headers?.cookie === 'string') {
            const match = req.headers.cookie.match(/(?:^|;\s*)saar_session=([^;]+)/);
            if (match && match[1]) token = decodeURIComponent(match[1]);
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload.sub || !payload.sid) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return { userId: payload.sub, sessionId: payload.sid };
  }
}
