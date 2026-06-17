import type { Request, Response, NextFunction } from "express";
import { getSession } from "../services/session.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  accessToken?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Dev mode bypass — user set by devModeMiddleware
  if (req.userId && req.accessToken) {
    next();
    return;
  }

  const cookieToken = req.cookies?.session_token;
  if (!cookieToken) {
    res.status(401).json({
      success: false,
      error: { code: "AUTH_REQUIRED", message: "Authentication required" },
    });
    return;
  }

  const session = getSession(cookieToken);
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