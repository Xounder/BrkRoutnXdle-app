# Task 11 — Production Polish

**ID:** TASK-11 | **Title:** Production Polish | **Owner:** senior-frontend | **Status:** Pending

---

## Acceptance Criteria

- [ ] CSS custom properties defined on `:root` for all design tokens (colors, typography, spacing, shadows, border-radius, animations); component styling consistently uses tokens
- [ ] App usable on mobile screen width (~375px) with all features accessible; Sidebar collapses by default on mobile (hamburger menu or tap); FAB for primary actions; bottom sheet for secondary actions instead of modals
- [ ] All form controls, buttons, and navigation are keyboard-accessible; screen readers can read calendar events, task names, and action labels (ARIA labels, roles, live regions); color not the only indicator of state
- [ ] API errors show human-readable messages with suggested actions; every failure state has a "Retry" button
- [ ] Closing the browser tab with unsaved preview triggers a `beforeunload` confirmation; navigating away from a preview triggers an in-app unsaved changes dialog
- [ ] Error message templates cover: network errors, auth errors, calendar errors, event errors

---

## Dependencies

- **Required:** TASK-08 (provides preview state for unsaved changes protection)
- Design system and accessibility work can begin alongside TASK-08/09/10 and continue iteratively. Mobile experience needs core features to exist.

---

## Technical Context

### Relevant Components

- All UI components across `apps/web` and `packages/ui`
- `apps/web/src/styles/design-tokens.css`
- `apps/web/src/styles/global.css`
- `apps/web/src/components/ErrorBoundary.tsx`
- `apps/web/src/components/ErrorFallback.tsx`
- `apps/web/src/components/RetryButton.tsx`
- `apps/web/src/hooks/useUnsavedChanges.ts`
- `apps/web/src/hooks/useKeyboardNavigation.ts`
- `packages/ui/src/` (design system components)

### Relevant Modules

- `apps/web`
- `packages/ui`

### Relevant APIs

- N/A (frontend-only concerns)

### Relevant Types

- `ErrorSeverity`, `ErrorCategory`, `ErrorMessage`

---

## Step-by-Step Implementation — Part 1 of 2

*Continuation: `references/TASK-11-impl-guide-part2.md`*

---

### Step 1: Create `packages/ui/src/components/Button.tsx`

```tsx
import React from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg, var(--clr-accent), var(--clr-accent-dark))",
    color: "var(--clr-primary-dark)",
    boxShadow: "var(--shadow-accent-glow)",
    border: "none",
  },
  secondary: {
    background: "transparent",
    color: "var(--clr-primary)",
    border: "2px solid var(--clr-primary)",
  },
  danger: {
    background: "linear-gradient(135deg, var(--clr-coral), var(--clr-coral-dark))",
    color: "#fff",
    border: "none",
    boxShadow: "var(--shadow-coral-glow)",
  },
  ghost: {
    background: "transparent",
    color: "var(--clr-primary-dark)",
    border: "none",
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "6px 16px", fontSize: "13px" },
  md: { padding: "10px 24px", fontSize: "14px" },
  lg: { padding: "14px 32px", fontSize: "16px" },
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      style={{
        borderRadius: "var(--radius-round)",
        fontWeight: 700,
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        minHeight: "48px",
        transition: "transform 0.2s ease, opacity 0.2s ease",
        opacity: disabled || isLoading ? 0.6 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {isLoading ? (
        <span
          role="status"
          aria-label="Loading"
          style={{
            display: "inline-block",
            width: 16,
            height: 16,
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      ) : (
        children
      )}
    </button>
  );
}
```

### Step 2: Create `packages/ui/src/components/Modal.tsx`

```tsx
import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

export function Modal({ isOpen, onClose, title, children, ariaLabel }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? title}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", justifyContent: "center", alignItems: "center",
        zIndex: 1000, animation: "fadeIn 0.2s ease-out",
      }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        style={{
          background: "var(--clr-card)",
          borderRadius: "var(--radius-xl)",
          padding: "32px",
          width: "440px",
          maxWidth: "90vw",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, color: "var(--clr-primary-dark)", fontSize: "24px" }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", color: "#666" }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

### Step 3: Create `packages/ui/src/index.ts`

```ts
export { Button } from "./components/Button";
export type { ButtonVariant, ButtonSize } from "./components/Button";
export { Modal } from "./components/Modal";
```

### Step 4: Create `apps/web/src/styles/design-tokens.css`

```css
:root {
  --clr-primary: #2BA8A2;
  --clr-primary-light: #3CC4BD;
  --clr-primary-dark: #1E8C86;
  --clr-primary-bg: #E8F6F5;
  --clr-accent: #FFD23F;
  --clr-accent-light: #FFE47A;
  --clr-accent-dark: #E6B800;
  --clr-coral: #EF6C4A;
  --clr-coral-light: #FF8A6A;
  --clr-coral-dark: #D45233;
  --clr-cream: #FFF8E7;
  --clr-sky: #5DADE2;
  --clr-surface: #EFF8F7;
  --clr-card: #FFFFFF;
  --clr-success: #27AE60;
  --clr-error: #E74C3C;

  --font-stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-display: 72px;
  --font-h1: 48px;
  --font-h2: 36px;
  --font-body: 16px;
  --font-sm: 14px;
  --font-xs: 12px;

  --space-xs: 8px;
  --space-sm: 16px;
  --space-md: 24px;
  --space-lg: 32px;
  --space-xl: 48px;

  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;
  --radius-round: 9999px;

  --shadow-sm: 0 2px 8px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.12);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.16);
  --shadow-card: 0 4px 20px rgba(43,168,162,0.10);
  --shadow-coral-glow: 0 4px 20px rgba(239,108,74,0.35);
  --shadow-teal-glow: 0 4px 20px rgba(43,168,162,0.30);
  --shadow-accent-glow: 0 4px 20px rgba(255,210,63,0.40);
  --shadow-sky-glow: 0 4px 16px rgba(93,173,226,0.30);
  --shadow-focus: 0 0 0 4px rgba(43,168,162,0.15);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-stack);
  font-size: var(--font-body);
  color: #333;
  background: var(--clr-surface);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4 {
  letter-spacing: 0.08em;
}

:focus-visible {
  outline: 3px solid var(--clr-primary);
  outline-offset: 2px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

```

### Step 5: Create `apps/web/src/components/ErrorBoundary.tsx`

```tsx
import React from "react";
import { ErrorFallback } from "./ErrorFallback";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { console.error("ErrorBoundary caught:", error, errorInfo); }
  handleRetry = () => { this.setState({ hasError: false, error: null }); };
  render() {
    if (this.state.hasError) return <ErrorFallback error={this.state.error!} onRetry={this.handleRetry} />;
    return this.props.children;
  }
}
```

### Step 6: Create `apps/web/src/components/ErrorFallback.tsx`

```tsx
import React from "react";
import { Button } from "@brkroutnxdle/ui";

interface ErrorFallbackProps { error: Error; onRetry: () => void; }

const ERROR_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: "You need to log in to continue.", AUTH_EXPIRED: "Your session has expired. Please log in again.",
  AUTH_INVALID: "There was a problem with your login. Please try again.",
  CALENDAR_NOT_FOUND: "Could not find your BrkRoutnXdle calendar. Please try refreshing.",
  CALENDAR_ACCESS_DENIED: "Calendar access was denied. Please check your Google Calendar permissions.",
  EVENT_NOT_FOUND: "The event could not be found. It may have been deleted.",
  EVENT_CREATE_FAILED: "Could not create the event. Please try again.",
  EVENT_UPDATE_FAILED: "Could not update the event. Please try again.",
  EVENT_DELETE_FAILED: "Could not delete the event. Please try again.",
  GOOGLE_API_ERROR: "Google Calendar is temporarily unavailable. Please try again later.",
  GOOGLE_RATE_LIMIT: "Too many requests. Please wait a moment and try again.",
  RATE_LIMIT_EXCEEDED: "Too many requests. Please wait a moment and try again.",
  VALIDATION_ERROR: "Please check your input and try again.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
};

function getErrorMessage(error: Error): string {
  for (const [code, msg] of Object.entries(ERROR_MESSAGES)) {
    if (error.message.includes(code)) return msg;
  }
  return "Something unexpected happened. Please try again.";
}

export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  return (
    <div role="alert" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--clr-surface)" }}>
      <div style={{ background: "var(--clr-card)", borderRadius: "var(--radius-xl)", padding: "48px", maxWidth: "480px", boxShadow: "var(--shadow-coral-glow)", border: "2px solid var(--clr-coral)" }}>
        <h2 style={{ color: "var(--clr-coral-dark)", margin: "0 0 12px" }}>Oops!</h2>
        <p style={{ color: "#666", fontSize: "16px", margin: "0 0 24px" }}>{getErrorMessage(error)}</p>
        <Button variant="danger" onClick={onRetry}>Try Again</Button>
      </div>
    </div>
  );
}
```

*See `references/TASK-11-impl-guide-part2.md` for `useUnsavedChanges`, FAB, BottomSheet, and final integration including the testing checklist and references.*
