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
