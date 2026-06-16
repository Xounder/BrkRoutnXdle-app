# TASK-02 Implementation Guide — Part 3

Validation and testing guidance.

---

## Validation Steps

After implementing all files:

1. **Install dependencies** — Run `pnpm install` from the project root.

2. **Verify compilation** — Run `pnpm build` (from root). The API package must compile without errors.

3. **Start the server** — Run `pnpm dev` from `apps/api/` (or `pnpm -F @brkroutnxdle/api dev` from root). The server starts on port 3001.

4. **Health check** — `curl http://localhost:3001/health` returns `{ "status": "ok", "timestamp": "..." }`.

5. **Auth endpoints** — These require Google OAuth credentials to be set in `.env`:
   - `GET /api/v1/auth/google` — redirects to Google consent screen
   - After callback, session cookie is set
   - `GET /api/v1/auth/me` — returns user info (with cookie)
   - `POST /api/v1/auth/logout` — clears session

6. **Calendar endpoints** — Require auth:
   - `GET /api/v1/calendars` — lists calendars
   - `POST /api/v1/calendars/ensure` — creates BrkRoutnXdle calendar

## Environment Variables Required for Full Testing

```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

## Dev Mode Bypass Testing

```powershell
curl -H "X-Dev-Access-Token: YOUR_PLAYGROUND_TOKEN" http://localhost:3001/api/v1/calendars
```

This bypasses OAuth and uses the provided token directly.

## Files Created Summary

| File | Purpose |
|------|---------|
| `apps/api/src/index.ts` | Express server entry point |
| `apps/api/src/types.ts` | API-specific TypeScript types |
| `apps/api/src/middleware/errorHandler.ts` | Global error handler |
| `apps/api/src/middleware/rateLimiter.ts` | Rate limiting (100 req/min) |
| `apps/api/src/middleware/auth.ts` | Auth middleware + dev mode bypass |
| `apps/api/src/services/session.ts` | In-memory session store |
| `apps/api/src/services/google-oauth.ts` | Google OAuth 2.0 + Calendar client factory |
| `apps/api/src/routes/auth.ts` | Auth endpoints (login, callback, me, logout) |
| `apps/api/src/routes/calendars.ts` | Calendar endpoints (list, ensure, get) |
| `apps/api/.env.example` | Environment variable template |
