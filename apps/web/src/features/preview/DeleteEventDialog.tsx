import React from "react";

interface DeleteEventDialogProps {
  isOpen: boolean;
  eventTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteEventDialog({
  isOpen,
  eventTitle,
  onConfirm,
  onCancel,
}: DeleteEventDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#fff", borderRadius: "24px", padding: "32px",
          width: "360px", maxWidth: "90vw", textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 12px", color: "#EF6C4A" }}>Delete Event</h3>
        <p style={{ fontSize: "14px", color: "#666", margin: "0 0 24px" }}>
          Are you sure you want to delete "{eventTitle}"? This action cannot be undone until you save.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 24px",
              border: "2px solid #2BA8A2",
              borderRadius: "9999px",
              background: "transparent",
              color: "#2BA8A2",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 24px",
              background: "linear-gradient(135deg, #EF6C4A, #D45233)",
              border: "none",
              borderRadius: "9999px",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
