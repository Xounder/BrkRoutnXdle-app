import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { User } from "@brkroutnxdle/shared";
import { api } from "../services/api";
import { setRemoteAccount } from "../services/remoteConfirmation";

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
  const sessionVersion = useRef(0);
  const [state, setState] = useState<AuthState>({
    user: null,
    authenticated: false,
    loading: true,
  });

  const refreshSession = useCallback(async () => {
    const version = ++sessionVersion.current;
    // Until /auth/me settles, neither the previous identity nor its calendar is visible.
    setRemoteAccount(null);
    setState({ user: null, authenticated: false, loading: true });
    try {
      const user = await api.get<User>("/auth/me");
      if (version !== sessionVersion.current) return;
      setRemoteAccount(user.id);
      setState({ user, authenticated: true, loading: false });
    } catch {
      if (version !== sessionVersion.current) return;
      setRemoteAccount(null);
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
    ++sessionVersion.current;
    setRemoteAccount(null);
    setState({ user: null, authenticated: false, loading: false });
    await api.post("/auth/logout");
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
