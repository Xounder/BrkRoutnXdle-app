import React from "react";

interface CompletionActionProps {
  eventId: string;
  isCompleted: boolean;
  isGenerated: boolean;
  onToggle: (eventId: string, isCompleted: boolean) => void;
}

export function CompletionAction({
  eventId,
  isCompleted,
  isGenerated,
  onToggle,
}: CompletionActionProps) {
  if (!isGenerated) return null; // Only BrkRoutnXdle events can be completed

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle(eventId, isCompleted);
      }}
      style={{
        padding: "4px 12px",
        borderRadius: "9999px",
        border: "none",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 700,
        background: isCompleted
          ? "linear-gradient(135deg, #27AE60, #1E8449)"
          : "transparent",
        color: isCompleted ? "#fff" : "#27AE60",
        outline: isCompleted ? "none" : "2px solid #27AE60",
      }}
      title={isCompleted ? "Mark as incomplete" : "Mark as completed"}
    >
      {isCompleted ? "✓ Done" : "Complete"}
    </button>
  );
}
