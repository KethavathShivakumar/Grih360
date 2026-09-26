import app from '../backend/src/app';
import { connectDatabase } from '../backend/src/config/database';
import { AuthService } from '../backend/src/services/auth.service';

let isInitialized = false;

export default async function handler(req: any, res: any) {
  if (!isInitialized) {
    try {
      connectDatabase();
      await AuthService.seedDemoUsers();
      const { PropertyService } = require('../backend/src/services/property.service');
      await PropertyService.seedDefaultProperties();
    } catch (e) {
      console.warn('[Vercel Serverless Init Notice]:', e);
    }
    isInitialized = true;
  }
  return app(req, res);
}
