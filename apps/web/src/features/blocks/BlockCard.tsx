import React from "react";
import type { BlockedSlot, BlockType } from "@brkroutnxdle/shared";
import { BlockType as BlockTypeEnum } from "@brkroutnxdle/shared";

interface BlockCardProps {
  block: BlockedSlot;
  onEdit: (block: BlockedSlot) => void;
  onDelete: (id: string) => void;
}

const TYPE_LABELS: Record<BlockType, string> = {
  [BlockTypeEnum.SingleDay]: "Single Day",
  [BlockTypeEnum.RecurringWeekday]: "Recurring (Weekday)",
  [BlockTypeEnum.RecurringPeriod]: "Recurring (Period)",
};

export function BlockCard({ block, onEdit, onDelete }: BlockCardProps) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "16px",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        borderLeft: "6px solid #EF6C4A",
        marginBottom: "8px",
        cursor: "pointer",
      }}
      onClick={() => onEdit(block)}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <strong style={{ fontSize: "14px", color: "#333" }}>
            {block.title ?? TYPE_LABELS[block.blockType]}
          </strong>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
            {block.startDate}{block.endDate ? ` \u2192 ${block.endDate}` : ""}
            {block.startTime ? ` \u00B7 ${block.startTime}-${block.endTime}` : ""}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
          style={{ background: "none", border: "none", color: "#EF6C4A", cursor: "pointer" }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
