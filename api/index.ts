import app from '../backend/src/app';
import { connectDatabase } from '../backend/src/config/database';
export default async function handler(req: any, res: any) {
  // Fast-path OPTIONS preflight requests directly to Express CORS middleware
  if (req.method !== 'OPTIONS') {
    try {
      await connectDatabase();
    } catch (err: any) {
      console.error('[Vercel Serverless] DB connection notice:', err?.message || err);
    }
  }

  return app(req, res);
}

