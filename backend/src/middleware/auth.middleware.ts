import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.util';
import { ApiResponseUtil } from '../utils/api-response.util';
import { UserRole } from '../types/auth.types';
import { UserModel } from '../models/user.model';
import { memoryUsers } from '../services/auth.service';
import mongoose from 'mongoose';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    email: string;
    name?: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ApiResponseUtil.error(res, 'Authentication token missing or invalid', 401, 'UNAUTHORIZED');
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = JwtUtil.verifyAccessToken(token);

    // Account status validation (deactivated accounts blocked immediately)
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(payload.userId)) {
      const user = await UserModel.findById(payload.userId).select('isActive role name email').lean();
      if (!user) {
        ApiResponseUtil.error(res, 'User account no longer exists', 401, 'USER_NOT_FOUND');
        return;
      }
      if (!user.isActive) {
        ApiResponseUtil.error(res, 'Your account has been deactivated. Please contact support at 6300063704.', 401, 'ACCOUNT_DEACTIVATED');
        return;
      }
      req.user = {
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
        name: user.name,
      };
    } else {
      const memUser = memoryUsers.get(payload.userId);
      if (memUser && memUser.isActive === false) {
        ApiResponseUtil.error(res, 'Your account has been deactivated. Please contact support at 6300063704.', 401, 'ACCOUNT_DEACTIVATED');
        return;
      }
      req.user = payload;
    }

    next();
  } catch (err) {
    ApiResponseUtil.error(res, 'Invalid or expired access token', 401, 'TOKEN_EXPIRED');
    return;
  }
};
