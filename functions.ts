import * as crypto from 'crypto';
import * as path from 'path';

/**
 * Format bytes to human readable
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Convert seconds to human readable
 */
export const runtime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);
  
  return parts.join(' ') || '0s';
};

/**
 * Convert string to boolean
 */
export const toBool = (v?: string) => v?.toLowerCase() === 'true';

/**
 * Generate random strinh
 */
export const generateRandomString = (length: number = 8): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateCustomFilename = (originalFilename: string): string => {
  const ext = path.extname(originalFilename);
  const randomPart = generateRandomString(8);
  return `${randomPart}${ext}`;
};

export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

/**
 * Validate file allowed types
 */
export const isAllowedFileType = (filename: string, allowedTypes: string[]): boolean => {
  if (allowedTypes.length === 0) return true;
  const ext = getFileExtension(filename).substring(1);
  return allowedTypes.includes(ext.toLowerCase());
};

/**
 * Generate hash for
 */
export const generateFileHash = (content: Buffer): string => {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
};


export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 255);
};

/**
 * Parse MEGA account creds
 */
export const parseMegaAccounts = (accountString: string): Array<{email: string, password: string}> => {
  if (!accountString) return [];
  
  return accountString.split(';')
    .map(entry => {
      const [email, password] = entry.split(':');
      return email && password ? { email: email.trim(), password: password.trim() } : null;
    })
    .filter(Boolean) as Array<{email: string, password: string}>;
};

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * current timestamp
 */
export const getCurrentTimestamp = (): number => {
  return Date.now();
};

export const minutesToMs = (minutes: number): number => {
  return minutes * 60 * 1000;
};

/**
 * Check if a timestamp is expired
 */
export const isExpired = (timestamp: number, currentTime?: number): boolean => {
  const now = currentTime || getCurrentTimestamp();
  return timestamp <= now;
};

/**
 * setTimeOut
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  
  throw lastError!;
};

