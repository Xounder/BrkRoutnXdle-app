# TASK-02 Implementation Guide — Part 2

Continuation of the auth and calendar setup implementation.

---

### Step 9 (continued): Create `apps/api/src/routes/auth.ts` — Full implementation

```ts
import { Router } from "express";
import type { Response } from "express";
import { getAuthUrl, exchangeCode, refreshAccessToken } from "../services/google-oauth.js";
import { createSession, getSession, destroySession } from "../services/session.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";

export const authRouter = Router();

/** GET /auth/google — Redirects to Google OAuth consent screen. */
authRouter.get("/google", (_req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

/** GET /auth/google/callback — Handles OAuth callback. */
authRouter.get("/google/callback", async (req, res: Response) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      throw new AppError(400, "AUTH_FAILED", "No authorization code provided");
    }

    const sessionData = await exchangeCode(code);
    const token = createSession(sessionData);

    res.cookie("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
    res.redirect(clientOrigin + "/dashboard");
  } catch (err) {
    if (err instanceof AppError) {
      const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
      res.redirect(clientOrigin + "/?error=" + encodeURIComponent(err.code));
      return;
    }
    throw err;
  }
});

/** GET /auth/me — Returns current user info if authenticated. */
authRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const token = req.cookies?.session_token;
  const session = getSession(token);

  if (!session) {
    res.status(401).json({
      success: false,
      error: { code: "AUTH_EXPIRED", message: "Session expired" },
    });
    return;
  }

  // Check if token needs refresh
  if (Date.now() > session.expiryDate - 300_000) {
    try {
      const refreshed = await refreshAccessToken(session);
      const newToken = createSession(refreshed);
      res.cookie("session_token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });
    } catch {
      destroySession(token);
      res.status(401).json({
        success: false,
        error: { code: "AUTH_EXPIRED", message: "Session expired. Please log in again." },
      });
      return;
    }
  }

  res.json({
    success: true,
    data: session.user,
  });
});

/** POST /auth/logout — Destroys session. */
authRouter.post("/logout", (_req, res: Response) => {
  const token = _req.cookies?.session_token;
  if (token) {
    destroySession(token);
  }
  res.clearCookie("session_token");
  res.json({ success: true, data: null });
});
```

### Step 10: Create `apps/api/src/routes/calendars.ts` — Calendar discovery and creation

```ts
import { Router } from "express";
import type { Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getCalendarClient } from "../services/google-oauth.js";
import { AppError } from "../middleware/errorHandler.js";

export const calendarsRouter = Router();

const BRKROUTNXDL_E_CALENDAR_NAME = "BrkRoutnXdle";

/** GET /calendars — Lists all user's Google Calendars. */
calendarsRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const calendar = getCalendarClient(req.accessToken!);
  const { data } = await calendar.calendarList.list();
  res.json({ success: true, data: data.items });
});

/** POST /calendars/ensure — Creates BrkRoutnXdle calendar if it doesn't exist. */
calendarsRouter.post("/ensure", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const calendar = getCalendarClient(req.accessToken!);
  const { data: list } = await calendar.calendarList.list();

  const existing = list.items?.find(
    (cal) => cal.summary === BRKROUTNXDL_E_CALENDAR_NAME
  );

  if (existing) {
    res.json({ success: true, data: { id: existing.id, summary: existing.summary, created: false } });
    return;
  }

  const { data: created } = await calendar.calendars.insert({
    requestBody: {
      summary: BRKROUTNXDL_E_CALENDAR_NAME,
      description: "Calendar managed by BrkRoutnXdle for generated schedule events",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  res.status(201).json({ success: true, data: { id: created.id, summary: created.summary, created: true } });
});

/** GET /calendars/brkroutnxdle — Returns the BrkRoutnXdle calendar details. */
calendarsRouter.get("/brkroutnxdle", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const calendar = getCalendarClient(req.accessToken!);
  const { data: list } = await calendar.calendarList.list();
  const brkCal = list.items?.find(
    (cal) => cal.summary === BRKROUTNXDL_E_CALENDAR_NAME
  );

  if (!brkCal) {
    throw new AppError(404, "CALENDAR_NOT_FOUND", "BrkRoutnXdle calendar not found. Create it first via POST /calendars/ensure.");
  }

  res.json({ success: true, data: brkCal });
});
```

### Step 11: Create `apps/api/.env.example`

```
PORT=3001
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/v1/auth/google/callback
```

### Step 12: Dev Mode Bypass — Add to `apps/api/src/middleware/auth.ts`

Append the following to the existing `auth.ts` file (after the `requireAuth` function):

```ts
/**
 * Dev mode bypass: accepts a Google OAuth Playground token from the
 * X-Dev-Access-Token header. When set, this token is used as the access
 * token for all Google API calls. Only active in development.
 */
const devModeTokens = new Map<string, string>();

export function setDevModeToken(sessionId: string, token: string): void {
  devModeTokens.set(sessionId, token);
}

export function clearDevModeToken(sessionId: string): void {
  devModeTokens.delete(sessionId);
}

export function devModeMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === "production") {
    next();
    return;
  }

  const devToken = req.headers["x-dev-access-token"] as string | undefined;
  if (devToken) {
    req.accessToken = devToken;
    req.userId = "dev-user";
  }
  next();
}
```

Import `NextFunction` at the top of the file:

```ts
import type { Request, Response, NextFunction } from "express";
```

### Step 13: Wire dev mode middleware in `apps/api/src/index.ts`

Add the dev mode middleware before auth routes. Insert after `app.use(rateLimiter);`:

```ts
import { devModeMiddleware } from "./middleware/auth.js";

// ... after rateLimiter:
app.use(devModeMiddleware);
```

---

*Continue to Part 3 for remaining details.*
