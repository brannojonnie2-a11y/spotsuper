// Client-safe configuration store
// Uses environment variables and in-memory storage
// Server-side file operations are handled in config-store.server.ts

export interface AppConfig {
  telegramBotToken: string;
  telegramChatId: string;
  adminPassword: string;
  blockedIps: string[];
}

// In-memory config storage for client-side use
let configCache: AppConfig = {
  telegramBotToken: process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || '',
  adminPassword: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'weareme',
  blockedIps: [],
};

export const getConfig = (): AppConfig => {
  return { ...configCache };
};

export const updateTelegramConfig = (botToken: string, chatId: string): AppConfig => {
  configCache.telegramBotToken = botToken;
  configCache.telegramChatId = chatId;
  return { ...configCache };
};

export const updateAdminPassword = (newPassword: string): AppConfig => {
  configCache.adminPassword = newPassword;
  return { ...configCache };
};

export const addBlockedIp = (ip: string): AppConfig => {
  if (!configCache.blockedIps.includes(ip)) {
    configCache.blockedIps.push(ip);
  }
  return { ...configCache };
};

export const removeBlockedIp = (ip: string): AppConfig => {
  configCache.blockedIps = configCache.blockedIps.filter(blockedIp => blockedIp !== ip);
  return { ...configCache };
};

export const isIpBlocked = (ip: string): boolean => {
  return configCache.blockedIps.includes(ip);
};

export const getBlockedIps = (): string[] => {
  return [...configCache.blockedIps];
};
