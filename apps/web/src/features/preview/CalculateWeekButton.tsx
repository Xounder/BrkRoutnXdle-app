import React from "react";

interface CalculateWeekButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}

export function CalculateWeekButton({ onClick, disabled, isLoading }: CalculateWeekButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      style={{
        padding: "10px 24px",
        background: isLoading ? "#ccc" : "linear-gradient(135deg, #FFD23F, #E6B800)",
        border: "none",
        borderRadius: "9999px",
        fontWeight: 700,
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        color: "#1E8C86",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        opacity: disabled || isLoading ? 0.7 : 1,
      }}
    >
      {isLoading ? (
        <>
          <span
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              border: "2px solid #1E8C86",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
            }}
          />
          Generating...
        </>
      ) : (
        "Calculate Week"
      )}
    </button>
  );
}
