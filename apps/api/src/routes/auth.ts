import { Router, type Router as ExpressRouter } from "express";
import type { Response } from "express";
import { getAuthUrl, exchangeCode, refreshAccessToken } from "../services/google-oauth.js";
import { createSession, getSession, destroySession } from "../services/session.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";

export const authRouter: ExpressRouter = Router();

authRouter.get("/google", (_req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

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
      maxAge: 24 * 60 * 60 * 1000,
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

  res.json({ success: true, data: session.user });
});

authRouter.post("/logout", (_req, res: Response) => {
  const token = _req.cookies?.session_token;
  if (token) destroySession(token);
  res.clearCookie("session_token");
  res.json({ success: true, data: null });
});