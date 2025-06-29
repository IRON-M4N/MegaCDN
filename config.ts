import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import type { Config } from './types';
import { toBool } from './functions'


//load from env
if (fs.existsSync('.env')) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} else if (fs.existsSync('config.env')) {
  dotenv.config({ path: path.resolve(process.cwd(), 'config.env') });
}

const config: Config = {
  mega: {
    accounts: process.env.MEGA_ACCOUNT || 'ironman@onlyfins.com:hoshi ni naruuu',
  },
  server: {
    port: Number(process.env.PORT) || 3000,
    maxFileSize: Number(process.env.MAX_FILE_SIZE) || 100,
    maxFiles: Number(process.env.MAX_FILES) || 10,
    cacheTTL: Number(process.env.CACHE_TTL) || 3600,
    //have to change this soon
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/x-flv',
      'video/3gpp',
      'video/x-ms-wmv',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/aac',
      'audio/webm',
      'audio/flac',
      'audio/x-ms-wma',
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'text/csv',
      'text/xml',
      'application/json',
      'application/xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/gzip',
      'application/x-tar',
      'application/octet-stream',
      'application/x-executable',
      'application/x-sharedlib',
      'application/x-deb',
      'application/x-rpm',
      'application/vnd.android.package-archive',
      'application/x-msdownload',
      'application/x-apple-diskimage',
    ],
  },
  rateLimit: {
    max: Number(process.env.MAX_REQUESTS) || 100,
    timeWindow: process.env.RATE_LIMIT || '1 minute',
  },
  auth: {
    enable: toBool(process.env.AUTHORIZATION),
    keys: process.env.AUTH_TOKEN ? process.env.AUTH_TOKEN.split(',').filter(Boolean) : [],
  },
  autoDelete: {
    enable: toBool(process.env.AUTO_DELETE),
    minutes: Number(process.env.DELETE_TIME) || 1440,
  },
  storage: process.env.TEMP === 'file' ? 'file' : 'memory',
  DATABASE_URL: process.env.DATABASE_URL || undefined,
  FILENAMES: toBool(process.env.FILENAMES),
};

export default config;
