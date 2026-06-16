import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "@brkroutnxdle/shared";
import { api } from "../services/api";

interface AuthState {
  user: User | null;
  authenticated: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    authenticated: false,
    loading: true,
  });

  const refreshSession = useCallback(async () => {
    try {
      const user = await api.get<User>("/auth/me");
      setState({ user, authenticated: true, loading: false });
    } catch {
      setState({ user: null, authenticated: false, loading: false });
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(() => {
    window.location.href = "/api/v1/auth/google";
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setState({ user: null, authenticated: false, loading: false });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}