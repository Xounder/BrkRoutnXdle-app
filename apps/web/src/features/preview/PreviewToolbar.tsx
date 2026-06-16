import React from "react";
import { SaveButton } from "./SaveButton";

interface PreviewToolbarProps {
  onGenerateAgain: () => void;
  onDiscard: () => void;
  isLoading: boolean;
  eventCount: number;
  onSave: () => void;
  saveState: { status: string; progress: number };
}

const toolbarButtonStyle: React.CSSProperties = {
  padding: "6px 16px",
  border: "2px solid #2BA8A2",
  borderRadius: "9999px",
  background: "transparent",
  color: "#2BA8A2",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "13px",
};

export function PreviewToolbar({
  onGenerateAgain,
  onDiscard,
  isLoading,
  eventCount,
  onSave,
  saveState,
}: PreviewToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "8px 16px",
        background: "#E8F6F5",
        borderRadius: "12px",
        border: "2px solid #14b8a6",
      }}
    >
      <span style={{ fontSize: "14px", fontWeight: 600, color: "#1E8C86" }}>
        Preview: {eventCount} events
      </span>

      <button
        onClick={onGenerateAgain}
        disabled={isLoading}
        style={toolbarButtonStyle}
      >
        Generate Again
      </button>

      <button
        onClick={onDiscard}
        style={{
          ...toolbarButtonStyle,
          borderColor: "#EF6C4A",
          color: "#EF6C4A",
        }}
      >
        Discard
      </button>

      <SaveButton
        onClick={onSave}
        disabled={isLoading}
        isSaving={saveState.status === "saving"}
        progress={saveState.progress}
      />
    </div>
  );
}
