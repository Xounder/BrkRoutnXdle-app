import React from "react";
import { Drawer } from "@mantine/core";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      position="bottom"
      size="70vh"
      title={title}
      closeOnClickOutside
      closeOnEscape
      trapFocus
      withCloseButton
    >
      {children}
    </Drawer>
  );
}
