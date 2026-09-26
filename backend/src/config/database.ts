import mongoose from 'mongoose';
import { config } from './env';

let cachedPromise: Promise<typeof mongoose | void> | null = null;
let lastMongoError: string | null = null;

export const getLastMongoError = (): string | null => lastMongoError;

export const connectDatabase = async (): Promise<typeof mongoose | void> => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (mongoose.connection.readyState === 2 && cachedPromise) {
    return cachedPromise;
  }

  const rawUri = (config.mongodbUri || process.env.MONGODB_URI || '').trim();

  if (!rawUri) {
    lastMongoError = 'MONGODB_URI is not defined in environment variables';
    console.error('[Database] MONGODB_URI is not set in environment.');
    return;
  }

  const sanitizedUri = rawUri.replace(/:([^@]+)@/, ':****@');

  mongoose.connection.removeAllListeners('connected');
  mongoose.connection.removeAllListeners('error');
  mongoose.connection.removeAllListeners('disconnected');

  mongoose.connection.on('connected', () => {
    lastMongoError = null;
    console.log(`[Database] MongoDB Event: Connected successfully to ${sanitizedUri.split('@').pop() || 'host'}`);
  });

  mongoose.connection.on('error', (err) => {
    lastMongoError = err.message;
    console.error('[Database] MongoDB Event Error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB Event: Disconnected');
  });

  cachedPromise = (async () => {
    try {
      mongoose.set('strictQuery', true);

      console.log(`[Database] Initiating connection to ${sanitizedUri}...`);

      const conn = await mongoose.connect(rawUri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 1,
      });

      lastMongoError = null;
      console.log(`[Database] MongoDB Connected: Host ${conn.connection.host}, Database: ${conn.connection.name}`);

      try {
        const { ServiceRequestService } = require('../services/service-request.service');
        await ServiceRequestService.seedDefaultCategories();
      } catch (seedErr) {
        console.warn('[Database] Service categories seeding notice:', seedErr);
      }

      return conn;
    } catch (error: any) {
      lastMongoError = error?.message || 'Failed to connect to MongoDB';
      console.error(`[Database] MongoDB Connection Notice: ${lastMongoError}`);
      throw error;
    } finally {
      cachedPromise = null;
    }
  })();

  return cachedPromise;
};

export const getMongoStatus = (): 'connected' | 'connecting' | 'disconnected' | 'disconnecting' => {
  const readyState = mongoose.connection.readyState;
  switch (readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    case 0:
    default:
      return 'disconnected';
  }
};
