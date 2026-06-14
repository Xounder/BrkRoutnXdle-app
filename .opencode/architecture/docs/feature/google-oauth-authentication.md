# Google OAuth Authentication

## Status

Planned (V1)

---

## Purpose

Allow the user to authenticate with their Google account.

Authentication is the entry point of the application — no feature is accessible before login.

---

## Source Documents

- `ux-flows.md` — First Access and Returning User flows
- `google-calendar-integration.md` — OAuth flow, token management, scopes
- `api-specification.md` — Auth endpoints, session model
- `security-architecture.md` — Token storage, session protection, threat model

---

## Flow

```text
Frontend
    ↓
GET /auth/google
    ↓
Google Login
    ↓
GET /auth/google/callback
    ↓
Token Exchange
    ↓
Session Created
    ↓
Frontend Authenticated
```

---

## Returning User

```text
Open App
    ↓
Validate Session
    ↓
Load Calendars
    ↓
Load Events
    ↓
Open Dashboard
```

---

## Session Model

Backend maintains:

- Access Token
- Refresh Token
- Session Metadata

Frontend never receives:

- Refresh Token
- Client Secret

---

## Session Protection

- HttpOnly Cookies
- Secure Cookies
- SameSite=Lax

---

## Security Constraints

- Tokens stored in backend memory only
- No secrets exposed to frontend
- Automatic refresh via backend

---

## Error Scenarios

| Error | Resolution |
|---|---|
| AUTH_REQUIRED | Redirect to login |
| AUTH_EXPIRED | Re-authenticate |
| AUTH_INVALID | Login again |
| Token theft | Backend-only storage prevents exposure |

---

## Success Criteria

1. User can authenticate with Google account.
2. Session is maintained across page refreshes.
3. Tokens are refreshed automatically.
4. Frontend never receives sensitive credentials.
5. Logout invalidates the session.

---

## References

- Backend API: `GET /auth/google`, `GET /auth/google/callback`, `GET /auth/me`, `POST /auth/logout`
- Detailed endpoints: `docs/backend/references/api-endpoints.md`
