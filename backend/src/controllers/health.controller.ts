import { Request, Response } from 'express';
import { getHealthStatus } from '../services/health.service';

export const checkHealth = (req: Request, res: Response): void => {
  const healthData = getHealthStatus();
  res.status(200).json(healthData);
};
