import * as fs from 'fs';
import * as path from 'path';

// Define the path to the persistent configuration file
// Note: On Vercel, the filesystem is read-only. 
// For persistent changes, consider using a database.
// This path is adjusted to be relative to the project root.
const CONFIG_FILE_PATH = path.resolve(process.cwd(), 'config.json');



export interface AppConfig {
  telegramBotToken: string;
  telegramChatId: string;
  adminPassword: string;
  blockedIps: string[];
}

// Function to read the configuration from the file
export const readConfig = (): AppConfig => {
  try {
    const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
    const config = JSON.parse(data);
    // Ensure blockedIps is an array, defaulting to empty if missing
    if (!config.blockedIps) {
      config.blockedIps = [];
    }
    return config as AppConfig;
  } catch (error) {
    console.error('Error reading config file. Using defaults.', error);
    // Fallback to environment variables and default blockedIps
    return {
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '',
      telegramChatId: process.env.TELEGRAM_CHAT_ID || process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || '',
      adminPassword: process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'weareme',
      blockedIps: [],
    };
  }
};

// Function to write the configuration to the file
export const writeConfig = (config: AppConfig): void => {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing config file:', error);
  }
};

export const getConfig = (): AppConfig => {
  return readConfig();
};

export const updateTelegramConfig = (botToken: string, chatId: string): AppConfig => {
  const currentConfig = getConfig();
  currentConfig.telegramBotToken = botToken;
  currentConfig.telegramChatId = chatId;
  writeConfig(currentConfig);
  return { ...currentConfig };
};

export const updateAdminPassword = (newPassword: string): AppConfig => {
  const currentConfig = getConfig();
  currentConfig.adminPassword = newPassword;
  writeConfig(currentConfig);
  return { ...currentConfig };
};

export const addBlockedIp = (ip: string): AppConfig => {
  const currentConfig = getConfig();
  if (!currentConfig.blockedIps.includes(ip)) {
    currentConfig.blockedIps.push(ip);
    writeConfig(currentConfig);
  }
  return { ...currentConfig };
};

export const removeBlockedIp = (ip: string): AppConfig => {
  const currentConfig = getConfig();
  const initialLength = currentConfig.blockedIps.length;
  currentConfig.blockedIps = currentConfig.blockedIps.filter(blockedIp => blockedIp !== ip);
  if (currentConfig.blockedIps.length !== initialLength) {
    writeConfig(currentConfig);
  }
  return { ...currentConfig };
};

export const isIpBlocked = (ip: string): boolean => {
  return getConfig().blockedIps.includes(ip);
};

export const getBlockedIps = (): string[] => {
  return [...getConfig().blockedIps];
};
