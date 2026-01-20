import { getConfig } from './config-storage';

// Admin authentication store for persistent login

const ADMIN_AUTH_KEY = 'admin_auth_token';

// Generate a simple token (in production, use proper JWT)
export const generateAuthToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Verify password and return token
export const verifyAdminPassword = (password: string): string | null => {
  const config = getConfig();
  if (password === config.adminPassword) {
    return generateAuthToken();
  }
  return null;
};

// Validate token (simple check, in production use proper JWT validation)
export const validateAuthToken = (token: string): boolean => {
  return token && token.length > 0;
};
