import app from '../backend/src/app';
import { connectDatabase } from '../backend/src/config/database';
import { AuthService } from '../backend/src/services/auth.service';
import { PropertyService } from '../backend/src/services/property.service';
import mongoose from 'mongoose';

let isSeeded = false;

export default async function handler(req: any, res: any) {
  // Fast-path OPTIONS preflight requests directly to Express CORS middleware
  if (req.method !== 'OPTIONS') {
    try {
      await connectDatabase();
    } catch (err: any) {
      console.error('[Vercel Serverless] DB connection notice:', err?.message || err);
    }

    if (!isSeeded && mongoose.connection.readyState === 1) {
      try {
        await AuthService.seedDemoUsers();
        await PropertyService.seedDefaultProperties();
        isSeeded = true;
      } catch (e) {
        console.warn('[Vercel Serverless Seed Notice]:', e);
      }
    }
  }

  return app(req, res);
}
