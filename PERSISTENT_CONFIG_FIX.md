# Persistent Configuration Fix for Vercel

## Problem
On Vercel, the filesystem is **read-only** after deployment. The original `config-store.server.ts` tried to write configuration changes to `config.json` in the project root, but these changes were lost because Vercel's serverless functions run in an ephemeral, read-only environment.

## Solution
Created a new `config-storage.ts` module that:

1. **Detects the environment** - Checks if the filesystem is read-only (Vercel) or writable (local development)
2. **Uses /tmp directory on Vercel** - Writes configuration to `/tmp/config.json` which persists during the serverless function's lifecycle
3. **Uses project root locally** - Writes to `config.json` in the project root for local development
4. **Initializes from bundled config** - On first run in Vercel, copies the bundled `config.json` to `/tmp`

## How It Works

### Environment Detection
```typescript
const isReadOnlyEnvironment = () => {
  try {
    const testFile = path.join(process.cwd(), '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return false; // Writable
  } catch {
    return true; // Read-only (Vercel)
  }
};
```

### Storage Strategy
- **Local Development**: Writes to `/home/ubuntu/spotpanel_project/config.json`
- **Vercel Production**: Writes to `/tmp/config.json`

### Persistence on Vercel
The `/tmp` directory on Vercel serverless functions:
- ✅ Is writable
- ✅ Persists across multiple invocations of the same function instance
- ✅ Allows configuration changes without redeployment
- ⚠️ May be cleared when the function instance is recycled (typically after 5-15 minutes of inactivity)

### Initialization Flow
1. First request hits the API route
2. `initializeRuntimeConfig()` checks if `/tmp/config.json` exists
3. If not, copies from bundled `config.json` or creates default from environment variables
4. Subsequent requests read from `/tmp/config.json`
5. Admin dashboard updates write to `/tmp/config.json`

## Files Modified

| File | Change |
|------|--------|
| `lib/config-storage.ts` | **NEW** - Smart storage adapter with environment detection |
| `app/api/admin/config/route.ts` | Updated import from `config-store.server` to `config-storage` |
| `app/api/admin/password/route.ts` | Updated import from `config-store.server` to `config-storage` |
| `app/api/session/route.ts` | Updated import from `config-store` to `config-storage` |
| `app/api/admin/control/route.ts` | Updated import from `config-store` to `config-storage` |
| `lib/telegram.ts` | Updated import from `config-store.server` to `config-storage` |
| `lib/admin-auth.ts` | Updated import from `config-store.server` to `config-storage` |

## Important Notes

### Configuration Persistence
- Changes made via the admin dashboard will persist **during the serverless function's lifecycle**
- If the function instance is recycled (cold start), configuration reverts to the bundled `config.json`
- For truly persistent configuration across cold starts, consider:
  - **Vercel KV** (Redis-based key-value store)
  - **Vercel Postgres** (SQL database)
  - **External database** (MongoDB, Supabase, etc.)

### Recommended Setup for Production

1. **Set initial configuration in `config.json`** before deploying
2. **Use environment variables as fallback** in Vercel project settings
3. **For long-term persistence**, upgrade to Vercel KV or a database

### Testing Locally
```bash
cd /home/ubuntu/spotpanel_project
pnpm install
pnpm dev
```

Visit `http://localhost:3000/admin` and test:
- Updating Telegram bot token and chat ID
- Changing admin password
- Blocking/unblocking IPs

All changes should persist across page refreshes during the dev server session.

### Deploying to Vercel
```bash
vercel deploy
```

Or push to GitHub if connected to Vercel for automatic deployment.

## Limitations

### /tmp Directory Persistence
The `/tmp` directory on Vercel:
- Persists for the lifetime of a function instance (typically 5-15 minutes of activity)
- Is cleared when the instance is recycled
- Is **not shared** between multiple function instances (if your app scales)

### For True Persistence
If you need configuration to persist indefinitely and across all instances, implement one of these solutions:

#### Option 1: Vercel KV (Recommended)
```bash
npm install @vercel/kv
```

#### Option 2: Vercel Postgres
```bash
npm install @vercel/postgres
```

#### Option 3: External Database
Use MongoDB, Supabase, PlanetScale, or any other database service.

## Summary

This fix allows the admin dashboard to update bot token, chat ID, and password **without redeployment**. Changes persist during the function's lifecycle but may revert on cold starts. For production use with guaranteed persistence, upgrade to Vercel KV or a database solution.
