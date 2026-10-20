import React from "react";
import { Modal as MantineModal } from "@mantine/core";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

export function Modal({ isOpen, onClose, title, children, ariaLabel }: ModalProps) {
  if (!isOpen) return null;

  return (
    <MantineModal
      opened={isOpen}
      onClose={onClose}
      title={title}
      aria-label={ariaLabel ?? title}
      centered
      size="md"
      closeOnClickOutside
      closeOnEscape
      trapFocus
    >
      {children}
    </MantineModal>
  );
}
