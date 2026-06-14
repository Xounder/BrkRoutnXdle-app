# Deployment Strategy

## Purpose

Define how the BrkRoutnXdle system is built, deployed, and served.

Based on the stateless backend principle (see `ADR-006`) and the no-database decision (see `ADR-002`), deployment is intentionally lightweight.

---

## Architecture Overview

```text
Browser → CDN (frontend static files)
       → Express BFF (Node.js)
       → Google Calendar API
```

---

## Frontend (apps/web)

| Aspect | Detail |
|---|---|
| Build tool | Vite |
| Output | Static HTML + JS + CSS |
| Hosting | Vercel / Netlify / Cloudflare Pages |
| Domain | `app.brkroutnxdle.com` |
| Environment | Single production environment |

### Build

```bash
cd apps/web
npm run build
# Output: apps/web/dist/
```

No server-side rendering. No backend for frontend serving — the BFF is a separate API layer.

---

## Backend (apps/api)

| Aspect | Detail |
|---|---|
| Runtime | Node.js (Express) |
| Hosting | Railway / Render / Fly.io |
| Domain | `api.brkroutnxdle.com` |
| Environment | Production only |

### Requirements

- Node.js LTS
- Google OAuth client credentials (environment variables)
- No database
- No persistent storage

### Environment Variables

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
SESSION_SECRET
FRONTEND_URL (for CORS)
PORT (default: 3001)
```

### Start

```bash
cd apps/api
npm run build
npm start
```

---

## CORS Configuration

Backend must accept requests only from the frontend domain.

```text
FRONTEND_URL = https://app.brkroutnxdle.com
```

---

## HTTPS

Required for both frontend and backend.

OAuth callbacks require HTTPS.

---

## Environment Separation

Single production environment for V1.

No staging environment — the Google Calendar API is always production.

Local development uses:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:3001
```

---

## Monitoring

- Backend uptime via health endpoint `GET /health`
- Error tracking via service provider logs
- No APM tool in V1

---

## Security & Secrets

Never commit to the repository:

```text
GOOGLE_CLIENT_SECRET
SESSION_SECRET
Any .env file
```

Store in hosting provider's secret manager.

---

## References

- `ADR-002` — No database decision
- `ADR-006` — Stateless backend decision
- `google-calendar-integration.md` — OAuth and API integration
- `api-specification.md` — Backend endpoints
