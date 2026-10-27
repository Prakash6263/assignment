const mongoose = require('mongoose');
const envConfig = require('./env.config');

/**
 * Connect to MongoDB with connection pooling and robust event listeners
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(envConfig.MONGODB_URI, {
      dbName: envConfig.DB_NAME,
      autoIndex: true, // Build indexes in development
    });

    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB connection disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database Error] Runtime error: ${err.message}`);
});

const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log('[Database] MongoDB connection closed gracefully');
};

module.exports = {
  connectDB,
  disconnectDB,
};
