import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { AuthJwtPayload } from './types/auth.jwt-payload';
import refreshJwtConfig from './config/refresh.jwt.config';
import { ConfigType } from '@nestjs/config';
import * as argon2 from 'argon2';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');

    const isPasswordMatch = await compare(password, user.password);
    if (!isPasswordMatch)
      throw new UnauthorizedException('Invalid credentials');

    return {
      id: user.id,
    };
  }

  async login(userId: number) {
    const { accessToken, refreshToken } = await this.generateToken(userId);
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.usersService.updateHashedRefreshToken(
      userId,
      hashedRefreshToken,
    );
    return {
      id: userId,
      accessToken,
      refreshToken,
    };
  }
  async generateToken(userId: number) {
    const payload: AuthJwtPayload = {
      sub: userId,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshTokenConfig),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(userId: number) {
    const { accessToken, refreshToken } = await this.generateToken(userId);
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.usersService.updateHashedRefreshToken(
      userId,
      hashedRefreshToken,
    );
    return {
      id: userId,
      accessToken,
      refreshToken,
    };
  }

  async logOut(userId: number) {
    try {
      return await this.usersService.updateHashedRefreshToken(userId, null);
    } catch (error) {
      throw error;
    }
  }

  async validateRefreshToken(userId: number, refreshToken: string) {
    const user = await this.usersService.findOne(userId);
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshTokenMatches = await argon2.verify(
      user.hashedRefreshToken,
      refreshToken,
    );
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return {
      id: userId,
    };
  }
}
