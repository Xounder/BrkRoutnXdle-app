# BrkRoutnXdle

Smart weekly schedule generator that distributes recurring tasks across available time slots, respecting user-defined blocks, calendar events, and scheduling preferences.

## Overview

For the scheduling recovery behavior, per-task commits and validation limitations,
see [Calendar Scheduling Recovery](RECOVERY.md).

BrkRoutnXdle connects to Google Calendar, reads existing events and blocked time, and generates an optimized weekly schedule from user-defined tasks. Each task can carry restrictions (weekdays-only, morning-only, afternoon-only, specific days) and priority levels. An internal domain algorithm distributes tasks across free slots, shuffles for variety, and validates the result against all constraints.

## Architecture

Monorepo managed with pnpm workspaces:

| Package | Description |
|---|---|
| `apps/web` | React + Vite SPA with FullCalendar, TanStack Query, react-hook-form |
| `apps/api` | Express server with Google OAuth, Google Calendar API, rate limiting |
| `packages/shared` | Shared TypeScript types, enums, and constants |
| `packages/domain` | Pure scheduling algorithm (no side effects, no async) |
| `packages/calendar` | Calendar event normalizer and Google Calendar wrapper |
| `packages/ui` | Shared UI components (Modal, BottomSheet, Button, FAB) |

## Domain Algorithm

The schedule generator runs in 12 phases inside `packages/domain/src/public/generateSchedule.ts`:

1. Build 30-minute week slots from settings
2. Mark past/completed slots as frozen
3. Mark slots occupied from existing calendar events
4. Apply blocked time (single-day, recurring-weekday, recurring-period)
5. Calculate available slots
6. Prioritize tasks by priority level
7. Distribute tasks across available slots respecting restrictions
8. Optionally shuffle for week-to-week variety
9. Generate calendar events
10. Validate schedule against all constraints
11. Report allocation failures
12. Return schedule result

### Task Restrictions

- `morning-only` — schedule before 12:00
- `afternoon-only` — schedule after 12:00
- `weekdays-only` — Mon–Fri only
- `no-weekends` — skip Sat–Sun
- `specific-days` — only on given day indexes

## Prerequisites

- **Node.js** >= 18 (tested with 22.x)
- **pnpm** >= 9.1
- **Google Cloud** project with Calendar API enabled
- **Google OAuth 2.0** credentials (Web application type)

## Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select existing)
3. Enable **Google Calendar API** → APIs & Services → Library
4. Go to **Credentials** → Create Credentials → **OAuth client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:3001/api/v1/auth/google/callback`
5. Copy the **Client ID** and **Client Secret**

## Environment

Copy `.env.example` (project root) to `.env`:

```bash
cp .env.example .env
# Windows: copy .env.example .env
```

Fill in your Google OAuth credentials:

```
PORT=3001
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/v1/auth/google/callback
```

## Install & Build

```bash
pnpm install
pnpm build
```

Build compiles all workspace packages (`shared`, `calendar`, `domain`, `ui`) to their `dist/` directories. This is required before running — the API resolves `@brkroutnxdle/*` packages from `dist/`.

## Running Modes

### Mode 1 — Full OAuth (production-like)

```bash
pnpm dev
```

This starts everything in parallel:
- `apps/api` → `http://localhost:3001` (Express + Google OAuth)
- `apps/web` → `http://localhost:5173` (Vite + React SPA)
- `packages/shared` → TypeScript watch mode

**Flow:**
1. Open `http://localhost:5173`
2. Click **"Login with Google"**
3. Authorize with your Google account (requires Calendar API access)
4. You are redirected to `/dashboard`
5. The app auto-discovers (or creates) a Google Calendar named "BrkRoutnXdle"

### Mode 2 — Dev Bypass (no OAuth needed)

Uses a token from [Google OAuth Playground](https://developers.google.com/oauthplayground) to skip the full OAuth flow. Useful for frontend-only development.

No Playground, para o bypass, basta selecionar apenas:
- https://www.googleapis.com/auth/calendar
- https://www.googleapis.com/auth/calendar.events

**Steps:**

1. Open [Google OAuth Playground](https://developers.google.com/oauthplayground)
2. Click the gear icon (⚙) → check **"Use your own OAuth credentials"**
3. Enter your **Client ID** and **Client Secret** (same as `.env`)
4. In the scopes field, select:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. Click **"Authorize APIs"** → log in with your Google account
6. Click **"Exchange authorization code for tokens"**
7. Copy the **access token**
8. In the running app (`http://localhost:5173`), open the browser console:

```js
sessionStorage.setItem("brkroutnxdle:devToken", "ya29...");
```

9. Reload the page — you are now authenticated without OAuth redirect
10. The token is sent as `X-Dev-Access-Token` header on every request
11. To disable, run `sessionStorage.removeItem("brkroutnxdle:devToken")` and reload

> **Note:** Playground tokens expire in ~1 hour. Repeat the exchange to get a new one.

## Scripts

| Command | Description |
|---|---|
| `pnpm build` | Build all workspace packages to `dist/` |
| `pnpm dev` | Run API, web, and shared in parallel (dev mode) |
| `pnpm typecheck` | TypeScript type checking across all packages |
| `pnpm start` | Run built API from `apps/api/dist/` (after `pnpm build`) |

## Troubleshooting

### `@brkroutnxdle/*` module not found / no export named

```bash
pnpm build
```

The API resolves workspace packages from their `dist/` directories. Always run `pnpm build` before `pnpm dev` if `dist/` is missing or outdated.

### Port already in use

Kill the process holding the port, or change `PORT` in `.env`.

### Google token expired (bypass mode)

OAuth Playground tokens expire after ~1 hour. Repeat the authorization code exchange to get a new token, then update `sessionStorage`.

### "BrkRoutnXdle calendar not found"

The app auto-creates a Google Calendar named "BrkRoutnXdle" on first login. If it fails, ensure the Google Calendar API is enabled in your Cloud Console and your OAuth consent screen includes the Calendar scopes.
