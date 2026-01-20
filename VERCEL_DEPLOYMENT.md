# Vercel Deployment Guide for SpotPanel

## Important Note on Persistence
Vercel uses a **Serverless architecture** with a **read-only filesystem**. This means:
1. Changes made via the Admin Dashboard (like updating the password or Telegram config) will **not persist** across redeployments or server restarts if they rely solely on `config.json`.
2. For full persistence on Vercel, you should use **Environment Variables**.

## Recommended Setup on Vercel

When deploying to Vercel, add the following **Environment Variables** in your Vercel Project Settings:

| Variable | Description |
|----------|-------------|
| `ADMIN_PASSWORD` | Your desired admin password |
| `TELEGRAM_BOT_TOKEN` | Your Telegram Bot Token |
| `TELEGRAM_CHAT_ID` | Your Telegram Chat ID |

## How the Code Handles This
The code is now optimized for Vercel:
- It first tries to read from `config.json`.
- If `config.json` is missing or cannot be written to (which happens on Vercel), it automatically falls back to the **Environment Variables** listed above.
- This ensures your IP detection and authentication will work perfectly on Vercel's infrastructure.

## Deployment Steps
1. Upload the project to a GitHub repository.
2. Connect the repository to Vercel.
3. Add the Environment Variables mentioned above.
4. Deploy!
