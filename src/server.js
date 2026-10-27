// Catch synchronous uncaught exceptions early before anything else boots
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION] Shutting down due to uncaught exception:', err);
  process.exit(1);
});

const app = require('./app');
const envConfig = require('./config/env.config');
const { connectDB, disconnectDB } = require('./config/db.config');

let server;

/**
 * Bootstrap server
 */
const startServer = async () => {
  // 1. Establish database connection
  await connectDB();

  // 2. Start HTTP server
  server = app.listen(envConfig.PORT, () => {
    console.log(
      `[Server] Server is running in ${envConfig.NODE_ENV} mode on port ${envConfig.PORT}`
    );
    console.log(`[Server] Health check: http://localhost:${envConfig.PORT}/api/health`);
  });
};

// Start application
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION] Shutting down gracefully...', err);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle termination signals (SIGTERM & SIGINT)
const gracefulShutdown = (signal) => {
  console.log(`[Server] ${signal} signal received. Closing HTTP server and database connections...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
