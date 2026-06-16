import React from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg, var(--clr-accent), var(--clr-accent-dark))",
    color: "var(--clr-primary-dark)",
    boxShadow: "var(--shadow-accent-glow)",
    border: "none",
  },
  secondary: {
    background: "transparent",
    color: "var(--clr-primary)",
    border: "2px solid var(--clr-primary)",
  },
  danger: {
    background: "linear-gradient(135deg, var(--clr-coral), var(--clr-coral-dark))",
    color: "#fff",
    border: "none",
    boxShadow: "var(--shadow-coral-glow)",
  },
  ghost: {
    background: "transparent",
    color: "var(--clr-primary-dark)",
    border: "none",
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "6px 16px", fontSize: "13px" },
  md: { padding: "10px 24px", fontSize: "14px" },
  lg: { padding: "14px 32px", fontSize: "16px" },
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      style={{
        borderRadius: "var(--radius-round)",
        fontWeight: 700,
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        minHeight: "48px",
        transition: "transform 0.2s ease, opacity 0.2s ease",
        opacity: disabled || isLoading ? 0.6 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {isLoading ? (
        <span
          role="status"
          aria-label="Loading"
          style={{
            display: "inline-block",
            width: 16,
            height: 16,
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      ) : (
        children
      )}
    </button>
  );
}
