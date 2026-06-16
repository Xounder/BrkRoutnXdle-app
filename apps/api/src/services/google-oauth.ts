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
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiryDate: tokens.expiry_date ?? Date.now() + 3600_000,
    user: {
      id: userInfo.id ?? "",
      email: userInfo.email ?? "",
      name: userInfo.name ?? "User",
      picture: userInfo.picture ?? undefined,
    },
  };
}

export async function refreshAccessToken(session: SessionData): Promise<SessionData> {
  oauth2Client.setCredentials({ refresh_token: session.refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  if (!credentials.access_token) {
    throw new AppError(401, "AUTH_EXPIRED", "Failed to refresh access token");
  }
  return {
    ...session,
    accessToken: credentials.access_token,
    expiryDate: credentials.expiry_date ?? Date.now() + 3600_000,
  };
}

export function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}