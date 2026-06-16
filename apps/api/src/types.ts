export interface SessionData {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  user: { id: string; email: string; name: string; picture?: string };
}

export interface DevModeState {
  enabled: boolean;
  token: string | null;
}

export interface TokenPayload {
  sessionId: string;
  userId: string;
}