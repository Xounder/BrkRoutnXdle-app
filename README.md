# BrkRoutnXdle

Smart weekly schedule generator that distributes recurring tasks across available time slots, respecting user-defined blocks, calendar events, and scheduling preferences.

## Overview

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

## Getting Started

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all packages in parallel (frontend + backend)
pnpm dev
```

### Environment

Create `apps/api/.env`:

```
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SESSION_SECRET=...
```

### Prerequisites

- Node.js >= 18
- pnpm >= 9.1
- Google Cloud project with Calendar API + OAuth 2.0 credentials

## Scripts

| Command | Description |
|---|---|
| `pnpm build` | Build all packages |
| `pnpm dev` | Run all packages in dev mode |
| `pnpm typecheck` | TypeScript type checking across all packages |
