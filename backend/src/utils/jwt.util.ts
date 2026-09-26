import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthTokens, UserRole } from '../types/auth.types';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export class JwtUtil {
  static generateTokens(payload: JwtPayload): AuthTokens {
    const accessToken = jwt.sign(payload, config.jwtAccessSecret, {
      expiresIn: '15m',
    });
    const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwtAccessSecret) as JwtPayload;
  }

  static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwtRefreshSecret) as JwtPayload;
  }
}
