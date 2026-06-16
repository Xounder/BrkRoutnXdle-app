# TASK-11 Implementation Guide — Part 2

Unsaved changes, FAB, BottomSheet, and final integration.

---

### Step 7: Create `apps/web/src/hooks/useUnsavedChanges.ts`

```ts
import { useEffect, useCallback } from "react";

/**
 * Hook that warns users before leaving the page or navigating away
 * when there is an active preview with unsaved changes.
 */
export function useUnsavedChanges(
  hasUnsavedChanges: boolean,
  onBeforeNavigate?: () => boolean,
) {
  // Browser tab close / refresh protection
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // Standard browser dialog
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  // In-app navigation guard (for react-router or similar)
  const checkNavigation = useCallback((): boolean => {
    if (hasUnsavedChanges && onBeforeNavigate) {
      return onBeforeNavigate();
    }
    return true;
  }, [hasUnsavedChanges, onBeforeNavigate]);

  return { checkNavigation };
}
```

### Step 8: Create `packages/ui/src/components/FAB.tsx` (Floating Action Button)

```tsx
import React from "react";

interface FABProps {
  onClick: () => void;
  label: string;
  icon?: string;
  position?: "bottom-right" | "bottom-left";
}

export function FAB({ onClick, label, icon = "+", position = "bottom-right" }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        position: "fixed",
        bottom: "24px",
        right: position === "bottom-right" ? "24px" : "auto",
        left: position === "bottom-left" ? "24px" : "auto",
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--clr-accent), var(--clr-accent-dark))",
        border: "none",
        boxShadow: "var(--shadow-accent-glow)",
        color: "var(--clr-primary-dark)",
        fontSize: "24px",
        fontWeight: 800,
        cursor: "pointer",
        zIndex: 900,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.2s ease",
      }}
    >
      {icon}
    </button>
  );
}
```

### Step 9: Create `packages/ui/src/components/BottomSheet.tsx`

```tsx
import React, { useEffect } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
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
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
          zIndex: 950, animation: "fadeIn 0.2s ease-out",
        }}
      />
      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--clr-card)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          padding: "24px",
          zIndex: 960,
          maxHeight: "70vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
          animation: "slideUp 0.3s ease-out",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "var(--clr-primary-dark)" }}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
```

### Step 10: Update `packages/ui/src/index.ts` — Add new exports

```ts
export { Button } from "./components/Button";
export type { ButtonVariant, ButtonSize } from "./components/Button";
export { Modal } from "./components/Modal";
export { FAB } from "./components/FAB";
export { BottomSheet } from "./components/BottomSheet";
```

### Step 11: Create `apps/web/src/styles/global.css`

```css
@import "./design-tokens.css";

/* Mobile responsive layout */
@media (max-width: 768px) {
  .sidebar-collapsed {
    width: 0 !important;
    min-width: 0 !important;
  }

  .header-view-switcher {
    display: none; /* Hide view switcher on mobile, use FAB instead */
  }

  .header-title {
    font-size: 16px !important;
  }
}

@media (max-width: 480px) {
  .calendar-toolbar {
    flex-direction: column;
    gap: 8px;
  }

  .modal-content {
    width: 100% !important;
    border-radius: var(--radius-md) !important;
    margin: 8px;
  }
}

/* Screen reader only utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
```

### Step 12: Create `apps/web/src/styles/CalendarStyles.css` — FullCalendar overrides

```css
/* BrkRoutnXdle generated events */
.fc-event.brk-generated {
  border-radius: 8px;
  border: none;
}

.fc-event.brk-generated:hover {
  filter: brightness(1.1);
}

/* Preview events (teal/translucent) */
.fc-event.brk-preview {
  border-radius: 8px;
  border: 2px dashed #0d9488;
  opacity: 0.9;
}

/* Completed events */
.fc-event.brk-completed {
  opacity: 0.7;
}

.fc-event.brk-completed::after {
  content: " ✓";
}

/* External events */
.fc-event.brk-external {
  border-radius: 8px;
  opacity: 0.8;
}
```

### Step 13: Wire it all together

Update `apps/web/src/main.tsx` to import the design tokens:

```tsx
import "./styles/design-tokens.css";
import "./styles/global.css";

// Wrap with ErrorBoundary:
import { ErrorBoundary } from "./components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* ... rest of providers ... */}
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
```

### Files Created Summary

| File | Purpose |
|------|---------|
| `packages/ui/src/components/Button.tsx` | Design system Button component |
| `packages/ui/src/components/Modal.tsx` | Accessible Modal with Escape key |
| `packages/ui/src/components/FAB.tsx` | Floating Action Button for mobile |
| `packages/ui/src/components/BottomSheet.tsx` | Mobile bottom sheet drawer |
| `packages/ui/src/index.ts` | UI package entry point with all exports |
| `apps/web/src/styles/design-tokens.css` | CSS custom properties for entire design system |
| `apps/web/src/styles/global.css` | Global styles and responsive breakpoints |
| `apps/web/src/styles/CalendarStyles.css` | FullCalendar visual overrides |
| `apps/web/src/components/ErrorBoundary.tsx` | React error boundary wrapper |
| `apps/web/src/components/ErrorFallback.tsx` | Error UI with retry button |
| `apps/web/src/hooks/useUnsavedChanges.ts` | Unsaved changes protection hook |
