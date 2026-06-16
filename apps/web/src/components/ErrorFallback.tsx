import React from "react";
import { Button } from "@brkroutnxdle/ui";

interface ErrorFallbackProps {
  error: Error;
  onRetry: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: "You need to log in to continue.",
  AUTH_EXPIRED: "Your session has expired. Please log in again.",
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
    <div
      role="alert"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "var(--clr-surface)",
      }}
    >
      <div
        style={{
          background: "var(--clr-card)",
          borderRadius: "var(--radius-xl)",
          padding: "48px",
          maxWidth: "480px",
          boxShadow: "var(--shadow-coral-glow)",
          border: "2px solid var(--clr-coral)",
        }}
      >
        <h2 style={{ color: "var(--clr-coral-dark)", margin: "0 0 12px" }}>Oops!</h2>
        <p style={{ color: "#666", fontSize: "16px", margin: "0 0 24px" }}>
          {getErrorMessage(error)}
        </p>
        <Button variant="danger" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
