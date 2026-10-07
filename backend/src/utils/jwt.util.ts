import jwt from 'jsonwebtoken';
import crypto from 'crypto';
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
    const tokenId = crypto.randomBytes(16).toString('hex');
    const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: '30d',
      jwtid: tokenId,
    });
    return { accessToken, refreshToken };
  }

  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwtAccessSecret) as JwtPayload;
  }

  static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwtRefreshSecret) as JwtPayload;
  }
}
