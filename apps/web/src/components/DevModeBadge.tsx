import React from "react";

interface DevModeBadgeProps {
  enabled: boolean;
  onClick: () => void;
}

export function DevModeBadge({ enabled, onClick }: DevModeBadgeProps) {
  if (import.meta.env.PROD) return null;

  return (
    <button
      onClick={onClick}
      title={enabled ? "Dev mode active — click to configure" : "Dev mode inactive — click to configure"}
      style={{
        position: "fixed",
        bottom: "8px",
        left: "8px",
        padding: "4px 12px",
        fontSize: "11px",
        fontWeight: 700,
        borderRadius: "9999px",
        border: "none",
        cursor: "pointer",
        zIndex: 999,
        background: enabled
          ? "linear-gradient(135deg, #EF6C4A, #D45233)"
          : "linear-gradient(135deg, #2BA8A2, #1E8C86)",
        color: "#fff",
        boxShadow: enabled
          ? "0 2px 8px rgba(239,108,74,0.35)"
          : "0 2px 8px rgba(43,168,162,0.30)",
      }}
    >
      {enabled ? "⚡ DEV" : "DEV"}
    </button>
  );
}