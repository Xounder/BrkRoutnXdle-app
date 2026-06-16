import React from "react";

interface ConflictDialogProps {
  isOpen: boolean;
  changedEventCount: number;
  onReload: () => void;
  onDiscardPreview: () => void;
}

export function ConflictDialog({
  isOpen,
  changedEventCount,
  onReload,
  onDiscardPreview,
}: ConflictDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1200,
      }}
      onClick={onDiscardPreview}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "24px",
          padding: "32px",
          width: "400px",
          maxWidth: "90vw",
          border: "2px solid #FFD23F",
          boxShadow: "0 4px 20px rgba(255,210,63,0.40)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 12px", color: "#E6B800" }}>
          Calendar Changes Detected
        </h3>
        <p style={{ fontSize: "14px", color: "#666", margin: "0 0 8px" }}>
          {changedEventCount} event(s) in your Google Calendar have changed
          since you generated the current preview.
        </p>
        <p style={{ fontSize: "14px", color: "#666", margin: "0 0 24px" }}>
          What would you like to do?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            onClick={onReload}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #FFD23F, #E6B800)",
              border: "none",
              borderRadius: "9999px",
              fontWeight: 700,
              cursor: "pointer",
              color: "#1E8C86",
            }}
          >
            Reload — Load latest calendar data
          </button>
          <button
            onClick={onDiscardPreview}
            style={{
              padding: "12px 24px",
              border: "2px solid #EF6C4A",
              borderRadius: "9999px",
              background: "transparent",
              color: "#EF6C4A",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Discard Preview — Start fresh
          </button>
        </div>
      </div>
    </div>
  );
}
