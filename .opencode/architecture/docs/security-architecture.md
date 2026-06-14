# Security Architecture

## Purpose

Define security boundaries, threat model, and mitigation strategies.

Security responsibilities are split between frontend and backend per the stateless backend principle (see `ADR-006`).

---

## Threat Model

### Assets

| Asset | Location | Sensitivity |
|---|---|---|
| Google OAuth tokens | Backend (memory) | Critical |
| Refresh tokens | Backend (memory) | Critical |
| Google Calendar data | Google servers | Medium |
| Task definitions | Frontend (localStorage) | Low |
| User settings | Frontend (localStorage) | Low |

---

### Threats

| Threat | Impact | Mitigation |
|---|---|---|
| Token theft | Full calendar access | Backend-only storage, HttpOnly cookies |
| XSS | localStorage read | Content Security Policy, input sanitization |
| CSRF | Unauthorized API calls | SameSite cookies, state parameter in OAuth |
| Token expiry | Service disruption | Automatic refresh via backend |
| Rate limit exhaustion | Service degradation | 100 req/min per session limit |

---

## Authentication

Provider: Google OAuth 2.0

Flow:

```text
Frontend → GET /auth/google → Google login
Google → callback → Backend exchanges code
Backend → creates session → returns HttpOnly cookie
```

See `google-calendar-integration.md` for detailed flow.

---

## Token Management

### Backend Only (Never Exposed to Frontend)

```text
Client Secret
Refresh Token
Access Token (stored in session, not localStorage)
```

### Session

| Property | Value |
|---|---|
| Storage | Backend memory |
| Transport | HttpOnly, Secure, SameSite=Lax |
| Expiry | Matches Google token expiry |

---

## Authorization

Rule set:

1. Only authenticated users can access API endpoints
2. Each user accesses only their own Google Calendar data
3. No role-based access control in V1

---

## Frontend Security

| Measure | Implementation |
|---|---|
| Content Security Policy | Restrict script sources, disallow inline |
| Input validation | Zod schemas on forms |
| localStorage scope | Only BrkRoutnXdle namespaced keys |
| No secrets | Frontend never receives tokens or client secrets |

---

## API Protection

| Measure | Implementation |
|---|---|
| Rate limiting | 100 requests/minute per session |
| CORS | Restricted to frontend origin |
| Validation | Zod on all request bodies |
| Error responses | No stack traces, no internal details |

---

## Secrets Management

### Never Commit

```text
.env files
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
SESSION_SECRET
```

### Storage

Hosting provider secret manager (Railway/Render/Fly.io).

---

## Logging Security

Never log:

```text
Access Token
Refresh Token
OAuth Code
Client Secret
```

See `logging-monitoring-strategy.md` for details.

---

## Future Considerations (V2+)

- Token encryption at rest
- Audit logging for sensitive operations
- OAuth scope reduction (separate read/write scopes)

---

## References

- `google-calendar-integration.md` — OAuth flow, scopes, calendars
- `api-specification.md` — endpoints, error codes, session model
- `deployment-strategy.md` — environment variables, HTTPS
- `logging-monitoring-strategy.md` — safe logging rules
