import { Request, Response } from 'express';
import { getHealthStatus } from '../services/health.service';
import { JwtUtil } from '../utils/jwt.util';

export const checkHealth = async (req: Request, res: Response): Promise<void> => {
  let isAdmin = false;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      const payload = JwtUtil.verifyAccessToken(token);
      if (payload && payload.role === 'ADMIN') {
        isAdmin = true;
      }
    } catch {
      // Unauthenticated / non-admin public caller
    }
  }

  const healthData = await getHealthStatus(isAdmin);
  res.status(200).json(healthData);
};

