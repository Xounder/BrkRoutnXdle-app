# Epic 01 — Google Authentication & Calendar Foundation

## Epic Information

### ID

EPIC-01

### Title

Google Authentication & Calendar Foundation

### Priority

High

### Status

Pending

---

## Objective

Enable the user to log in with their Google account and automatically set up the dedicated BrkRoutnXdle calendar — the foundational layer that everything else depends on.

---

## User Value

### Problem

The user cannot interact with the application at all without first authenticating with Google and having a dedicated calendar for generated events. This is the entry gate to the entire system.

### Expected Outcome

A new user opens the app, authenticates with Google in a few clicks, and lands on the dashboard with the BrkRoutnXdle calendar ready to use. A returning user is recognized automatically and goes straight to the dashboard.

### Success Criteria

- User can authenticate with a Google account
- Session persists across page refreshes
- Tokens refresh automatically without user intervention
- BrkRoutnXdle dedicated calendar is created on first login
- Returning users are recognized and skip the setup flow
- Frontend never receives sensitive credentials (refresh token, client secret)
- Logout invalidates the session

---

## Scope

### Included

- Google OAuth 2.0 login flow (frontend redirect + backend callback)
- Backend session management with HttpOnly, Secure, SameSite cookies
- Automatic access token refresh via the backend
- Google Calendar list discovery (primary + existing BrkRoutnXdle calendar)
- Dedicated BrkRoutnXdle calendar creation when none exists
- Session validation on app startup for returning users
- Logout flow that invalidates the session
- Error handling: expired/invalid token prompts re-authentication
- **Dev Mode Bypass**: toggle to use a manually provided Google OAuth Playground access token instead of the standard OAuth flow
- Dev mode bypass toggle UI (active/inactive indicator)
- Dev mode token input field in the settings/developer panel
- Visual indicator showing when bypass mode is active

### Excluded

- Cross-device session synchronization
- Multi-account support
- Calendar sharing or collaboration features
- Token persistence beyond session duration

---

## Deliverables

- A working Google OAuth login button and flow on the frontend
- A backend BFF with auth endpoints (`/auth/google`, `/auth/google/callback`, `/auth/me`, `/auth/logout`)
- Automated dedicated calendar creation on first login
- Session restoration for returning users
- Unauthenticated state (landing page before login)
- Dev mode bypass toggle and OAuth Playground token input in developer panel
- Backend endpoint to validate and use the Playground token for API calls

---

## Acceptance Criteria

- [ ] User clicks "Login with Google" and is redirected to Google consent screen
- [ ] After granting permission, user is redirected back to the app dashboard
- [ ] User can refresh the page and remain authenticated
- [ ] A dedicated "BrkRoutnXdle" calendar exists in the user's Google Calendar after first login
- [ ] User can log out and is redirected to the login screen
- [ ] Expired tokens trigger automatic refresh without user action
- [ ] Browser refresh does not expose sensitive tokens
- [ ] Dev mode bypass toggle is visible and functional in the developer panel
- [ ] When bypass is active, the app uses the provided OAuth Playground token for all Google API calls
- [ ] When bypass is inactive, the app falls back to the standard OAuth flow
- [ ] Visual indicator shows whether bypass mode is currently active or inactive

---

## Dependencies

### Required

- None (this is the foundation)

### Blocks

- EPIC-02 (Task & Block Definition)
- EPIC-03 (Calendar Navigation & Settings)
- EPIC-04 (Schedule Generation & Preview)
- EPIC-05 (Save & Manual Calendar Editing)
- EPIC-06 (Completion, Sync & Conflict Resolution)
- EPIC-07 (Production Polish)

---

## Risks

- Google OAuth configuration (redirect URIs, credentials) must be set up correctly in Google Cloud Console
- Token expiration and refresh race conditions during long sessions
- Calendar API quota limits on initial setup

---

## Notes

This epic is the critical path for all subsequent epics. Without authentication and a working calendar, no other feature is accessible.

---

## References

- `architecture/architecture.md` — ADR-004 (dedicated calendar)
- `architecture/google-calendar-integration.md` — OAuth flow, scopes, calendar creation
- `architecture/ux-flows.md` — First access and returning user flows
- `architecture/docs/backend/api-specification.md` — Auth endpoints
- `architecture/docs/feature/google-oauth-authentication.md` — Feature spec
- `architecture/docs/feature/dedicated-calendar-setup.md` — Feature spec
