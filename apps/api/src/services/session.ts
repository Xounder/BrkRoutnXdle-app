import type { SessionData } from "../types.js";

const sessions = new Map<string, SessionData>();
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export function createSession(data: SessionData): string {
  const token = crypto.randomUUID();
  sessions.set(token, data);
  setTimeout(() => sessions.delete(token), SESSION_DURATION_MS);
  return token;
}

export function getSession(token: string): SessionData | null {
  return sessions.get(token) ?? null;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}