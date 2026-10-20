import React from "react";
import { ActionIcon } from "@mantine/core";

interface FABProps {
  onClick: () => void;
  label: string;
  icon?: string;
  position?: "bottom-right" | "bottom-left";
}

export function FAB({ onClick, label, icon = "+", position = "bottom-right" }: FABProps) {
  return (
    <ActionIcon
      onClick={onClick}
      aria-label={label}
      size="xl"
      radius="xl"
      variant="filled"
      color="primary"
      style={{
        position: "fixed",
        bottom: "24px",
        right: position === "bottom-right" ? "24px" : "auto",
        left: position === "bottom-left" ? "24px" : "auto",
        zIndex: 900,
      }}
    >
      {icon}
    </ActionIcon>
  );
}
