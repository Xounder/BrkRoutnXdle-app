import React from "react";

interface RefreshButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function RefreshButton({ onClick, isLoading }: RefreshButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      style={{
        padding: "8px 20px",
        border: "2px solid #5DADE2",
        borderRadius: "9999px",
        background: isLoading ? "#E8F6F5" : "transparent",
        color: "#5DADE2",
        cursor: isLoading ? "not-allowed" : "pointer",
        fontWeight: 600,
        fontSize: "13px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      <span
        style={{
          display: "inline-block",
          transition: "transform 0.3s",
          ...(isLoading ? { animation: "spin 1s linear infinite" } : {}),
        }}
      >
        ↻
      </span>
      {isLoading ? "Refreshing..." : "Refresh"}
    </button>
  );
}
