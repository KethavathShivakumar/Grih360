import app from './app';
import { config, validateEnv } from './config/env';
import { connectDatabase } from './config/database';
import { AuthService } from './services/auth.service';

const startServer = async (): Promise<void> => {
  try {
    // 1. Validate environment configuration
    validateEnv();

    // 2. Start Express HTTP Server
    const server = app.listen(config.port, () => {
      console.log(`===================================================`);
      console.log(` Grih360 Backend API Server Running`);
      console.log(` Port:        ${config.port}`);
      console.log(` Environment: ${config.nodeEnv}`);
      console.log(` API Endpoint: http://localhost:${config.port}${config.apiVersion}/health`);
      console.log(`===================================================`);
    });

    // 3. Initiate MongoDB Connection in background
    connectDatabase();

    // 4. Seed default platform demo accounts & properties
    AuthService.seedDemoUsers()
      .then(() => {
        const { PropertyService } = require('./services/property.service');
        return PropertyService.seedDefaultProperties();
      })
      .catch((err) => console.warn('[Seed notice]:', err));

    // Graceful shutdown handling
    const shutdown = async () => {
      console.log('\n[Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('[Server] Critical startup error:', error);
    process.exit(1);
  }
};

startServer();
