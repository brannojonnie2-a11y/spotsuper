import * as fs from 'fs';
import * as path from 'path';

export interface AppConfig {
  telegramBotToken: string;
  telegramChatId: string;
  adminPassword: string;
  blockedIps: string[];
}

const CONFIG_FILE_PATH = path.resolve(process.cwd(), 'config.json');
const RUNTIME_CONFIG_PATH = '/tmp/config.json';

// Check if we're in a read-only environment (like Vercel)
const isReadOnlyEnvironment = () => {
  try {
    const testFile = path.join(process.cwd(), '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return false;
  } catch {
    return true;
  }
};

// Initialize runtime config from the bundled config.json
const initializeRuntimeConfig = (): void => {
  try {
    if (!fs.existsSync(RUNTIME_CONFIG_PATH)) {
      // Copy the bundled config.json to /tmp
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
        fs.writeFileSync(RUNTIME_CONFIG_PATH, data, 'utf-8');
      } else {
        // Create default config
        const defaultConfig: AppConfig = {
          telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '',
          telegramChatId: process.env.TELEGRAM_CHAT_ID || process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || '',
          adminPassword: process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'weareme',
          blockedIps: [],
        };
        fs.writeFileSync(RUNTIME_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      }
    }
  } catch (error) {
    console.error('Error initializing runtime config:', error);
  }
};

// Read configuration
export const readConfig = (): AppConfig => {
  try {
    const isReadOnly = isReadOnlyEnvironment();
    
    if (isReadOnly) {
      // In read-only environment (Vercel), use /tmp directory
      initializeRuntimeConfig();
      const data = fs.readFileSync(RUNTIME_CONFIG_PATH, 'utf-8');
      const config = JSON.parse(data);
      if (!config.blockedIps) {
        config.blockedIps = [];
      }
      return config as AppConfig;
    } else {
      // In writable environment (local), use project root
      const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const config = JSON.parse(data);
      if (!config.blockedIps) {
        config.blockedIps = [];
      }
      return config as AppConfig;
    }
  } catch (error) {
    console.error('Error reading config file. Using defaults.', error);
    return {
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '',
      telegramChatId: process.env.TELEGRAM_CHAT_ID || process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || '',
      adminPassword: process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'weareme',
      blockedIps: [],
    };
  }
};

// Write configuration
export const writeConfig = (config: AppConfig): void => {
  try {
    const isReadOnly = isReadOnlyEnvironment();
    
    if (isReadOnly) {
      // In read-only environment (Vercel), write to /tmp directory
      fs.writeFileSync(RUNTIME_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    } else {
      // In writable environment (local), write to project root
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Error writing config file:', error);
    throw error;
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
