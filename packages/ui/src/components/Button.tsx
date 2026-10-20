import React from "react";
import { Button as MantineButton } from "@mantine/core";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

function mapVariant(variant: ButtonVariant): { variant: "filled" | "default" | "subtle"; color?: "red" } {
  switch (variant) {
    case "primary":
      return { variant: "filled" };
    case "secondary":
      return { variant: "default" };
    case "danger":
      return { variant: "filled", color: "red" };
    case "ghost":
      return { variant: "subtle" };
  }
}

function mapSize(size: ButtonSize): "sm" | "md" | "lg" {
  return size;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const { variant: mantineVariant, color } = mapVariant(variant);
  const mantineSize = mapSize(size);

  return (
    <MantineButton
      variant={mantineVariant}
      color={color}
      size={mantineSize}
      disabled={disabled || isLoading}
      loading={isLoading}
      radius="xl"
      fw={700}
      {...props}
    >
      {children}
    </MantineButton>
  );
}
