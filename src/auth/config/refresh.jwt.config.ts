import { registerAs } from '@nestjs/config';
import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';

export default registerAs(
  'jwt',
  (): JwtSignOptions => ({
    secret: process.env.REFRESH_JWT_SECRET || 'refresh secret key',
    expiresIn: process.env.REFRESH_JWT_EXPIRE_IN || '7d',
  }),
);
