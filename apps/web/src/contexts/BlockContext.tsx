import React, { createContext, useContext, useState, useCallback } from "react";
import type { BlockedSlot, BlockType } from "@brkroutnxdle/shared";
import { BlockType as BlockTypeEnum } from "@brkroutnxdle/shared";
import { storage } from "../services/localStorage";

const STORAGE_KEY = "brkroutnxdle:blocks";

function generateId(): string {
  return crypto.randomUUID();
}

function loadBlocks(): BlockedSlot[] {
  return storage.get<BlockedSlot[]>(STORAGE_KEY, []);
}

interface BlockContextValue {
  blocks: BlockedSlot[];
  createBlock: (partial: Omit<BlockedSlot, "id" | "isRecurring">) => BlockedSlot;
  updateBlock: (id: string, partial: Partial<BlockedSlot>) => void;
  deleteBlock: (id: string) => void;
  getBlock: (id: string) => BlockedSlot | undefined;
}

const BlockContext = createContext<BlockContextValue | null>(null);

export function BlockProvider({ children }: { children: React.ReactNode }) {
  const [blocks, setBlocks] = useState<BlockedSlot[]>(loadBlocks);

  const persist = useCallback((next: BlockedSlot[]) => {
    setBlocks(next);
    storage.set(STORAGE_KEY, next);
  }, []);

  const createBlock = useCallback(
    (partial: Omit<BlockedSlot, "id" | "isRecurring">): BlockedSlot => {
      const block: BlockedSlot = {
        ...partial,
        id: generateId(),
        isRecurring: partial.blockType !== BlockTypeEnum.SingleDay,
      };
      persist([...blocks, block]);
      return block;
    },
    [blocks, persist],
  );

  const updateBlock = useCallback(
    (id: string, partial: Partial<BlockedSlot>) => {
      const next = blocks.map((b) => (b.id === id ? { ...b, ...partial } : b));
      persist(next);
    },
    [blocks, persist],
  );

  const deleteBlock = useCallback(
    (id: string) => {
      persist(blocks.filter((b) => b.id !== id));
    },
    [blocks, persist],
  );

  const getBlock = useCallback(
    (id: string) => blocks.find((b) => b.id === id),
    [blocks],
  );

  return (
    <BlockContext.Provider value={{ blocks, createBlock, updateBlock, deleteBlock, getBlock }}>
      {children}
    </BlockContext.Provider>
  );
}

export function useBlockContext(): BlockContextValue {
  const ctx = useContext(BlockContext);
  if (!ctx) throw new Error("useBlockContext must be used within BlockProvider");
  return ctx;
}
