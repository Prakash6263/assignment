const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

// Validate critical configuration on startup
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`[Configuration Error]: Missing critical environment variable: ${envVar}. Check your .env file.`);
  }
}

const envConfig = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI,
  DB_NAME: process.env.DB_NAME || 'assignment',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET}_refresh_secret`,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};

module.exports = envConfig;
