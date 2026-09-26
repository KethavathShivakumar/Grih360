import mongoose from 'mongoose';
import { config } from './env';

export const connectDatabase = async (): Promise<typeof mongoose | void> => {
  if (!config.mongodbUri) {
    console.error('[Database] MONGODB_URI is not set in environment.');
    return;
  }

  const sanitizedUri = config.mongodbUri.replace(/:([^@]+)@/, ':****@');

  mongoose.connection.on('connected', () => {
    console.log(`[Database] MongoDB Event: Connected successfully to ${sanitizedUri.split('@').pop() || 'host'}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('[Database] MongoDB Event Error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB Event: Disconnected');
  });

  try {
    mongoose.set('strictQuery', true);
    // Disable command buffering so operations fail fast / fallback when offline
    mongoose.set('bufferCommands', false);

    console.log(`[Database] Initiating connection to ${sanitizedUri}...`);

    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 2000,
    });

    console.log(`[Database] MongoDB Connected: Host ${conn.connection.host}, Database: ${conn.connection.name}`);
    
    // Seed default home service categories asynchronously
    try {
      const { ServiceRequestService } = require('../services/service-request.service');
      await ServiceRequestService.seedDefaultCategories();
    } catch (seedErr) {
      console.warn('[Database] Service categories seeding notice:', seedErr);
    }

    return conn;
  } catch (error) {
    const err = error as Error;
    console.warn(`[Database] Initial MongoDB connection notice: ${err.message}`);
    console.warn('[Database] The API server remains running in resilient mode.');
  }

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
