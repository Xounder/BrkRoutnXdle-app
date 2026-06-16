import React from "react";

interface SaveButtonProps {
  onClick: () => void;
  disabled: boolean;
  isSaving: boolean;
  progress: number;
}

export function SaveButton({ onClick, disabled, isSaving, progress }: SaveButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isSaving}
      style={{
        padding: "10px 32px",
        background: isSaving
          ? "#ccc"
          : "linear-gradient(135deg, #27AE60, #1E8449)",
        border: "none",
        borderRadius: "9999px",
        fontWeight: 700,
        cursor: disabled || isSaving ? "not-allowed" : "pointer",
        color: "#fff",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        opacity: disabled || isSaving ? 0.7 : 1,
      }}
    >
      {isSaving ? (
        <>
          <span style={{
            display: "inline-block",
            width: 16,
            height: 16,
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          Saving... {progress}%
        </>
      ) : (
        "Save to Calendar"
      )}
    </button>
  );
}
