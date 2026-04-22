import dotenv from 'dotenv';
dotenv.config();

export const config = {
  NODE_ENV:            process.env.NODE_ENV            || 'development',
  PORT:                process.env.PORT                || 5000,
  MONGODB_URI:         process.env.MONGODB_URI         || 'mongodb://localhost:27017/ecommerce',
  JWT_ACCESS_SECRET:   process.env.JWT_ACCESS_SECRET   || 'access_secret_change_in_production',
  JWT_ACCESS_EXPIRE:   process.env.JWT_ACCESS_EXPIRE   || '15m',
  JWT_REFRESH_SECRET:  process.env.JWT_REFRESH_SECRET  || 'refresh_secret_change_in_production',
  JWT_REFRESH_EXPIRE:  process.env.JWT_REFRESH_EXPIRE  || '7d',
  CLIENT_URL:          process.env.CLIENT_URL          || 'http://localhost:3000',
  UPLOAD_DIR:          process.env.UPLOAD_DIR          || 'uploads',
  MAX_FILE_SIZE:       process.env.MAX_FILE_SIZE       || 5242880,
};
