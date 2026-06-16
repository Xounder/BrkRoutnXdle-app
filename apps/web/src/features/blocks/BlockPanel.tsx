import React, { useState } from "react";
import { useBlocks } from "../../hooks/useBlocks";
import { BlockCard } from "./BlockCard";
import { BlockModal } from "./BlockModal";
import type { BlockedSlot } from "@brkroutnxdle/shared";

export function BlockPanel() {
  const { blocks, deleteBlock } = useBlocks();
  const [editingBlock, setEditingBlock] = useState<BlockedSlot | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ fontWeight: 600, color: "#1E8C86", fontSize: "14px" }}>
          Blocks ({blocks.length})
        </span>
        <button
          onClick={() => setIsCreating(true)}
          style={{
            padding: "4px 12px", background: "#EF6C4A", color: "#fff",
            border: "none", borderRadius: "9999px", cursor: "pointer", fontSize: "12px", fontWeight: 700,
          }}
        >
          + Block
        </button>
      </div>

      {blocks.length === 0 && (
        <p style={{ fontSize: "13px", color: "#999", textAlign: "center", padding: "16px" }}>
          No blocked slots yet.
        </p>
      )}

      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {blocks.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            onEdit={setEditingBlock}
            onDelete={deleteBlock}
          />
        ))}
      </div>

      {(isCreating || editingBlock) && (
        <BlockModal
          block={editingBlock}
          onClose={() => { setIsCreating(false); setEditingBlock(null); }}
        />
      )}
    </div>
  );
}
