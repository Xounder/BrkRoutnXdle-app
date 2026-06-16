# Task 02 — Backend Auth & Calendar Setup

## Task Information

### ID

TASK-02

### Title

Backend Auth & Calendar Setup

### Owner

senior-backend

### Status

Pending

---

## Description

Implement the Express BFF server with Google OAuth 2.0 authentication flow and dedicated BrkRoutnXdle calendar setup. This includes session management with HttpOnly cookies, automatic token refresh, dev mode bypass for OAuth Playground tokens, and calendar discovery/creation endpoints.

---

## Acceptance Criteria

- [ ] Express server starts on port 3001 with CORS configured for frontend origin
- [ ] `GET /health` returns 200 with health status
- [ ] `GET /api/v1/auth/google` initiates Google OAuth 2.0 flow and redirects to Google consent screen
- [ ] `GET /api/v1/auth/google/callback` handles the OAuth callback, exchanges code for tokens, creates session
- [ ] `GET /api/v1/auth/me` returns current user info if session is valid, 401 otherwise
- [ ] `POST /api/v1/auth/logout` invalidates the session and clears cookies
- [ ] Session is stored in HttpOnly, Secure, SameSite=Lax cookies
- [ ] Access tokens refresh automatically when expired (no user intervention)
- [ ] Frontend never receives refresh token or client secret
- [ ] `GET /api/v1/calendars` lists user's Google Calendars
- [ ] `POST /api/v1/calendars/ensure` creates the "BrkRoutnXdle" calendar if it doesn't exist, returns existing one if found
- [ ] `GET /api/v1/calendars/brkroutnxdle` returns the BrkRoutnXdle calendar details
- [ ] Dev mode bypass: backend accepts a provided OAuth Playground token via header/query and uses it for API calls
- [ ] Dev mode bypass has clear logging and error handling for invalid tokens

---

## Dependencies

### Required Tasks

- TASK-01

### Dependency Notes

Requires shared types (API response types, User type) from TASK-01.

---

## Technical Context

### Relevant Components

- `apps/api/src/index.ts` (Express server entry)
- `apps/api/src/routes/auth.ts`
- `apps/api/src/routes/calendars.ts`
- `apps/api/src/middleware/`
- `apps/api/src/services/google-oauth.ts`
- `apps/api/src/services/session.ts`

### Relevant Modules

- `apps/api`
- `packages/calendar` (calendar setup logic)

### Relevant APIs

- `GET /health`
- `GET /api/v1/auth/google`
- `GET /api/v1/auth/google/callback`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET /api/v1/calendars`
- `POST /api/v1/calendars/ensure`
- `GET /api/v1/calendars/brkroutnxdle`

### Relevant Types

- `User`, `Session`, `ApiResponse`, `ApiError`
- Google OAuth types (from `googleapis` library)

---

## Implementation Guidance — Part 1 of 3

*See continuation files in `tasks/references/` for Parts 2 and 3.*

---

### Step 1: Create `apps/api/src/index.ts` — Express server entry point

```ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { authRouter } from "./routes/auth.js";
import { calendarsRouter } from "./routes/calendars.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimiter } from "./middleware/rateLimiter.js";

const app = express();
const PORT = process.env.PORT ?? 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

app.use(helmet());
app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(rateLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/calendars", calendarsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`BrkRoutnXdle API running on http://localhost:${PORT}`);
});

export default app;
```

Sets up Express with security middleware, CORS for the Vite dev server, cookie parser for session cookies, and mounts all route handlers.

### Step 2: Create `apps/api/src/types.ts` — API-specific types

```ts
export interface SessionData {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

export interface DevModeState {
  enabled: boolean;
  token: string | null;
}

export interface TokenPayload {
  sessionId: string;
  userId: string;
}
```

### Step 3: Create `apps/api/src/middleware/errorHandler.ts`

```ts
import type { Request, Response, NextFunction } from "express";
import type { ApiResponse, ApiError } from "@brkroutnxdle/shared";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const apiError: ApiError = {
      code: err.code,
      message: err.message,
      details: err.details,
    };
    res.status(err.statusCode).json({ success: false, error: apiError });
    return;
  }

  console.error("Unhandled error:", err);
  const apiError: ApiError = {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
  };
  res.status(500).json({ success: false, error: apiError });
}
```

### Step 4: Create `apps/api/src/middleware/rateLimiter.ts`

```ts
import type { Request, Response, NextFunction } from "express";

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (entry.count >= MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please try again later.",
      },
    });
    return;
  }

  entry.count++;
  next();
}
```

### Step 5: Create `apps/api/src/middleware/auth.ts` — Authentication middleware

```ts
import type { Request, Response, NextFunction } from "express";
import { getSession } from "../services/session.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  accessToken?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.session_token;
  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: "AUTH_REQUIRED", message: "Authentication required" },
    });
    return;
  }

  const session = getSession(token);
  if (!session) {
    res.clearCookie("session_token");
    res.status(401).json({
      success: false,
      error: { code: "AUTH_EXPIRED", message: "Session has expired" },
    });
    return;
  }

  req.userId = session.user.id;
  req.accessToken = session.accessToken;
  next();
}
```

### Step 6: Create `apps/api/src/services/session.ts` — Session management

```ts
import type { SessionData } from "../types.js";

const sessions = new Map<string, SessionData>();
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Creates a new session and returns the session token. */
export function createSession(data: SessionData): string {
  const token = crypto.randomUUID();
  sessions.set(token, data);

  // Auto-expire after 24h
  setTimeout(() => sessions.delete(token), SESSION_DURATION_MS);
  return token;
}

/** Retrieves session data by token. Returns null if expired or not found. */
export function getSession(token: string): SessionData | null {
  return sessions.get(token) ?? null;
}

/** Destroys a session. */
export function destroySession(token: string): void {
  sessions.delete(token);
}
```

In-memory session store. Sessions expire after 24 hours. In production, use Redis or an encrypted cookie store.

### Step 7: Create `apps/api/src/services/google-oauth.ts` — Google OAuth service

```ts
import { google } from "googleapis";
import type { SessionData } from "../types.js";
import { AppError } from "../middleware/errorHandler.js";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3001/api/v1/auth/google/callback";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({ access_type: "offline", scope: SCOPES, prompt: "consent" });
}

export async function exchangeCode(code: string): Promise<SessionData> {
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new AppError(400, "AUTH_FAILED", "Failed to obtain tokens from Google");
  }
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data: userInfo } = await oauth2.userinfo.get();
  return {
    accessToken: tokens.access_token, refreshToken: tokens.refresh_token,
    expiryDate: tokens.expiry_date ?? Date.now() + 3600_000,
    user: { id: userInfo.id ?? "", email: userInfo.email ?? "", name: userInfo.name ?? "User", picture: userInfo.picture ?? undefined },
  };
}

export async function refreshAccessToken(session: SessionData): Promise<SessionData> {
  oauth2Client.setCredentials({ refresh_token: session.refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  if (!credentials.access_token) throw new AppError(401, "AUTH_EXPIRED", "Failed to refresh access token");
  return { ...session, accessToken: credentials.access_token, expiryDate: credentials.expiry_date ?? Date.now() + 3600_000 };
}

export function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}
```

### Step 8: See Part 2 for auth routes, Part 3 for validation

Auth routes, calendar routes, dev mode middleware, `.env.example`, and validation steps are in:
- `references/TASK-02-impl-guide-part2.md` (auth routes, calendar routes, dev mode)
- `references/TASK-02-impl-guide-part3.md` (validation, testing, files summary)

---

## Testing & Validation

See `references/TASK-02-impl-guide-part3.md` for the complete testing checklist, DOD, and references. Unit tests should cover auth service, session service, and dev mode bypass.
