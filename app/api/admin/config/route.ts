import { NextResponse } from 'next/server';
import { validateAuthToken } from '@/lib/admin-auth';
import { getConfig, updateTelegramConfig, addBlockedIp, removeBlockedIp, AppConfig } from '@/lib/config-storage';

// Helper to check authentication from the Authorization header
const checkAuth = (request: Request): NextResponse | null => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];
  if (!token || !validateAuthToken(token)) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }
  return null;
};

// GET /api/admin/config - Get current configuration (excluding sensitive details)
export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;

  try {
    const config = getConfig();
    // Exclude sensitive data like password and full bot token from the response
    const safeConfig = {
      telegramBotTokenSet: !!config.telegramBotToken,
      telegramChatId: config.telegramChatId,
      blockedIps: config.blockedIps,
    };
    return NextResponse.json(safeConfig);
  } catch (error) {
    console.error('Error fetching config:', error);
    return new NextResponse(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
  }
}

// PUT /api/admin/config - Update Telegram configuration
export async function PUT(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;

  try {
    const { telegramBotToken, telegramChatId } = await request.json();

    if (!telegramBotToken || !telegramChatId) {
      return new NextResponse(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
    }

    updateTelegramConfig(telegramBotToken, telegramChatId);
    return NextResponse.json({ success: true, message: 'Telegram configuration updated successfully' });

  } catch (error) {
    console.error('Error updating Telegram config:', error);
    return new NextResponse(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
  }
}

// POST /api/admin/config - Block or Unblock an IP address
export async function POST(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;

  try {
    const { action, ip } = await request.json();

    if (!action || !ip) {
      return new NextResponse(JSON.stringify({ message: 'Missing required fields: action and ip' }), { status: 400 });
    }

    let updatedConfig: AppConfig;
    if (action === 'block') {
      updatedConfig = addBlockedIp(ip);
    } else if (action === 'unblock') {
      updatedConfig = removeBlockedIp(ip);
    } else {
      return new NextResponse(JSON.stringify({ message: 'Invalid action. Use "block" or "unblock"' }), { status: 400 });
    }

    return NextResponse.json({ success: true, blockedIps: updatedConfig.blockedIps });
  } catch (error) {
    console.error('Error managing IP block list:', error);
    return new NextResponse(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
  }
}
