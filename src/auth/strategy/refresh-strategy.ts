import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthJwtPayload } from '../types/auth.jwt-payload';
import { Inject, Injectable } from '@nestjs/common';
import refreshJwtConfig from '../config/refresh.jwt.config';
import { Request } from 'express';
import { AuthService } from '../auth.service';
@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'refresh-jwt',
) {
  constructor(
    @Inject(refreshJwtConfig.KEY)
    private refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: refreshJwtConfiguration.secret,
      passReqToCallback: true,
    });
  }
  async validate(req: Request, payload: AuthJwtPayload) {
    const refreshTokenWithBearer = req.get('authorization'); // Bearer mkadadja
    const refreshToken = refreshTokenWithBearer.replace('Bearer', '').trim();
    const userId = payload.sub;

    return this.authService.validateRefreshToken(userId, refreshToken);
  }
}
