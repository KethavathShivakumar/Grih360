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
    if (!config.jwtAccessSecret || !config.jwtRefreshSecret) {
      console.error('[JwtUtil] Cannot generate tokens: JWT_ACCESS_SECRET or JWT_REFRESH_SECRET is not configured');
      throw {
        statusCode: 503,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Authentication service is temporarily unavailable due to missing token signing secrets.',
      };
    }
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

  static generateOnboardingToken(payload: any): string {
    return jwt.sign({ ...payload, purpose: 'GOOGLE_ONBOARDING' }, config.jwtAccessSecret, {
      expiresIn: '30m',
    });
  }

  static verifyOnboardingToken(token: string): any {
    try {
      const decoded: any = jwt.verify(token, config.jwtAccessSecret);
      if (decoded.purpose !== 'GOOGLE_ONBOARDING') {
        throw new Error('Invalid token purpose');
      }
      return decoded;
    } catch (e) {
      throw {
        statusCode: 401,
        code: 'INVALID_ONBOARDING_TOKEN',
        message: 'Onboarding session has expired or is invalid. Please sign in with Google again.',
      };
    }
  }

  static generateRegistrationToken(payload: { email: string; role?: string }): string {
    return jwt.sign({ ...payload, purpose: 'REGISTRATION_STEP' }, config.jwtAccessSecret, {
      expiresIn: '15m',
    });
  }

  static verifyRegistrationToken(token: string): { email: string; role?: string } {
    try {
      const decoded: any = jwt.verify(token, config.jwtAccessSecret);
      if (decoded.purpose !== 'REGISTRATION_STEP') {
        throw new Error('Invalid token purpose');
      }
      return decoded;
    } catch (e: any) {
      throw {
        statusCode: 401,
        code: 'REGISTRATION_SESSION_EXPIRED',
        message: 'Registration session expired. Please verify your email again.',
      };
    }
  }
}
