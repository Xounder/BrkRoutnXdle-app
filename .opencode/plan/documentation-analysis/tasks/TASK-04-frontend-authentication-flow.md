# Task 04 — Frontend Authentication Flow

## Task Information

**ID:** TASK-04 | **Title:** Frontend Authentication Flow | **Owner:** senior-frontend | **Status:** Pending

---

## Description

Implement the frontend authentication layer including the login page with Google OAuth button, auth context for session management, session restoration on startup, protected route handling, and the dev mode bypass UI with visual indicator.

---

## Acceptance Criteria

- [ ] Unauthenticated users see a landing page with "Login with Google" button
- [ ] Clicking "Login with Google" redirects to `GET /api/v1/auth/google`
- [ ] After OAuth callback, user is redirected to the app dashboard
- [ ] AuthContext manages `user` state and `authenticated` boolean
- [ ] Session restoration on app startup calls `GET /api/v1/auth/me`
- [ ] Authenticated users see the main dashboard (unauthenticated users see landing page)
- [ ] Protected routes redirect to landing page when not authenticated
- [ ] Logout button in the header calls `POST /api/v1/auth/logout` and redirects to landing page
- [ ] Dev mode bypass toggle is available in a developer panel
- [ ] When bypass is active, the app uses the provided OAuth Playground token for all API calls
- [ ] When bypass is inactive, the app falls back to standard OAuth flow
- [ ] Visual indicator shows whether bypass mode is active or inactive (e.g., colored badge in header)
- [ ] Token input field accepts and stores the Playground token for dev mode
- [ ] Page refresh does not expose sensitive tokens in the browser
- [ ] React Query is configured with base URL pointing to the API server

---

## Dependencies

### Required Tasks

- TASK-01
- TASK-02

### Dependency Notes

Requires shared types for `User` and `ApiResponse`. Requires backend auth endpoints to be functional.

---

## Technical Context

### Relevant Components

- `apps/web/src/pages/LoginPage.tsx`
- `apps/web/src/pages/DashboardPage.tsx`
- `apps/web/src/contexts/AuthContext.tsx`
- `apps/web/src/hooks/useAuth.ts`
- `apps/web/src/components/DevModePanel.tsx`
- `apps/web/src/components/DevModeBadge.tsx`
- `apps/web/src/services/api.ts` (React Query client setup)
- `apps/web/src/App.tsx` (providers, routing)

### Relevant Modules

- `apps/web`
- `packages/shared` (types)

### Relevant APIs

- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

### Relevant Types

- `User`, `AuthState`, `ApiResponse<User>`

---

## Step-by-Step Implementation — Part 1 of 2

*Continuation file: `references/TASK-04-impl-guide-part2.md`*

---

### Step 1: Create `apps/web/src/main.tsx` — Application entry point

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
```

Sets up React 18 with StrictMode, React Query with 5-min stale time, and AuthProvider wrapping the app.

### Step 2: Create `apps/web/src/services/api.ts` — API client

```ts
const API_BASE_URL = "/api/v1";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Base fetch wrapper that includes credentials and the dev mode header.
 * All API calls go through this function.
 */
export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Check for dev mode token
  const devToken = typeof window !== "undefined"
    ? sessionStorage.getItem("brkroutnxdle:devToken")
    : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
    ...(devToken ? { "X-Dev-Access-Token": devToken } : {}),
  };

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: "include", // sends HttpOnly cookies
  });

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(
      json.error?.code ?? "UNKNOWN_ERROR",
      json.error?.message ?? "An unknown error occurred",
      response.status,
    );
  }

  return json.data as T;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Convenience methods
export const api = {
  get: <T>(path: string, params?: Record<string, string>) =>
    apiFetch<T>(path, { params }),

  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) =>
    apiFetch<T>(path, { method: "DELETE" }),
};
```

### Step 3: Create `apps/web/src/contexts/AuthContext.tsx` — Authentication context

```tsx
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
```

### Step 4: Create `apps/web/src/pages/LoginPage.tsx`

```tsx
import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const { login, authenticated, loading } = useAuth();

  // If already authenticated, the App component will redirect
  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#EFF8F7",
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "#EFF8F7",
      gap: "32px",
    }}>
      <h1 style={{
        fontSize: "48px",
        fontWeight: 800,
        color: "#1E8C86",
        letterSpacing: "0.08em",
        margin: 0,
      }}>
        BrkRoutnXdle
      </h1>
      <p style={{
        fontSize: "16px",
        color: "#555",
        maxWidth: "400px",
        textAlign: "center",
        lineHeight: 1.5,
      }}>
        Generate optimized weekly schedules from your Google Calendar.
        Define tasks, set preferences, and let the algorithm do the rest.
      </p>
      <button
        onClick={login}
        style={{
          padding: "16px 48px",
          fontSize: "18px",
          fontWeight: 700,
          background: "linear-gradient(135deg, #FFD23F, #E6B800)",
          border: "none",
          borderRadius: "9999px",
          color: "#1E8C86",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(255,210,63,0.40)",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        Login with Google
      </button>
    </div>
  );
}
```

### Step 5: Create `apps/web/src/pages/DashboardPage.tsx`

```tsx
import React from "react";
import { useAuth } from "../contexts/AuthContext";

export function DashboardPage() {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: "24px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ color: "#1E8C86", margin: 0 }}>BrkRoutnXdle</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {user?.picture && <img src={user.picture} alt={user.name} style={{ width: 32, height: 32, borderRadius: "50%" }} />}
          <span>{user?.name}</span>
          <button onClick={logout} style={{ padding: "8px 24px", border: "2px solid #2BA8A2", borderRadius: "9999px", background: "transparent", color: "#2BA8A2", cursor: "pointer", fontWeight: 600 }}>Logout</button>
        </div>
      </header>
      <main><p style={{ color: "#666" }}>Dashboard content coming in future tasks.</p></main>
    </div>
  );
}
```

### Step 6: Create `apps/web/src/App.tsx` — Main app with routing

```tsx
import React from "react";
import { useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";

export default function App() {
  const { authenticated, loading } = useAuth();
  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#EFF8F7" }}><p>Loading...</p></div>;
  if (!authenticated) return <LoginPage />;
  return <DashboardPage />;
}
```

*See `references/TASK-04-impl-guide-part2.md` for DevModePanel, DevModeBadge, useDevMode hook, and validation/testing details.*
