import React, { useState } from "react";
import type { BlockedSlot, BlockType } from "@brkroutnxdle/shared";
import { BlockType as BlockTypeEnum } from "@brkroutnxdle/shared";
import { useBlocks } from "../../hooks/useBlocks";

interface BlockModalProps {
  block: BlockedSlot | null;
  onClose: () => void;
  defaultStartDate?: string; // pre-filled start date when creating (block is null)
  defaultEndDate?: string; // pre-filled end date when creating (block is null)
}

export function BlockModal({ block, onClose, defaultStartDate, defaultEndDate }: BlockModalProps) {
  const { createBlock, updateBlock } = useBlocks();
  const isEditing = block !== null;

  const [blockType, setBlockType] = useState<BlockType>(block?.blockType ?? BlockTypeEnum.SingleDay);
  const [title, setTitle] = useState(block?.title ?? "");
  const [startDate, setStartDate] = useState(block?.startDate ?? defaultStartDate ?? "");
  const [endDate, setEndDate] = useState(block?.endDate ?? defaultEndDate ?? "");
  const [startTime, setStartTime] = useState(block?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(block?.endTime ?? "10:00");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(block?.daysOfWeek ?? [1, 3, 5]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!startDate) { setError("Start date is required"); return; }
    if (blockType === BlockTypeEnum.RecurringPeriod && !endDate) {
      setError("End date is required for period blocks"); return;
    }

    const base: Omit<BlockedSlot, "id" | "isRecurring"> = {
      title: title || undefined,
      blockType,
      startDate,
      endDate: blockType === BlockTypeEnum.RecurringPeriod ? endDate : undefined,
      startTime: blockType !== BlockTypeEnum.SingleDay ? startTime : undefined,
      endTime: blockType !== BlockTypeEnum.SingleDay ? endTime : undefined,
      daysOfWeek: blockType === BlockTypeEnum.RecurringWeekday ? daysOfWeek : undefined,
    };

    if (isEditing) {
      updateBlock(block!.id, base);
    } else {
      createBlock(base);
    }
    onClose();
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
  };
  const modalStyle: React.CSSProperties = {
    background: "#fff", borderRadius: "24px", padding: "32px",
    width: "440px", maxWidth: "90vw",
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 20px", color: "#EF6C4A" }}>
          {isEditing ? "Edit Block" : "New Block"}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Label (optional)</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Type</span>
            <select value={blockType} onChange={(e) => setBlockType(e.target.value as BlockType)} style={inputStyle}>
              <option value="single-day">Single Day</option>
              <option value="recurring-weekday">Recurring Weekday</option>
              <option value="recurring-period">Recurring Period</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>
              {blockType === BlockTypeEnum.SingleDay ? "Date" : "Start Date"}
            </span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          </label>

          {blockType === BlockTypeEnum.RecurringPeriod && (
            <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>End Date</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
            </label>
          )}

          {blockType !== BlockTypeEnum.SingleDay && (
            <>
              <div style={{ display: "flex", gap: "12px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>Start Time</span>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>End Time</span>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} />
                </label>
              </div>
            </>
          )}

          {blockType === BlockTypeEnum.RecurringWeekday && (
            <fieldset style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "12px" }}>
              <legend style={{ fontSize: "14px", fontWeight: 600 }}>Days of Week</legend>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                  <label key={day} style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <input
                      type="checkbox"
                      checked={daysOfWeek.includes(i)}
                      onChange={() => {
                        setDaysOfWeek((prev) =>
                          prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i],
                        );
                      }}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {error && <p style={{ color: "#EF6C4A", fontSize: "13px", margin: 0 }}>{error}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button type="button" onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
            <button type="submit" style={primaryBtnStyle}>
              {isEditing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px", border: "2px solid #ddd", borderRadius: "8px", fontSize: "14px",
};
const primaryBtnStyle: React.CSSProperties = {
  padding: "10px 24px", background: "linear-gradient(135deg, #FFD23F, #E6B800)",
  border: "none", borderRadius: "9999px", fontWeight: 700, cursor: "pointer", color: "#1E8C86",
};
const secondaryBtnStyle: React.CSSProperties = {
  padding: "10px 24px", border: "2px solid #2BA8A2", borderRadius: "9999px",
  background: "transparent", color: "#2BA8A2", cursor: "pointer", fontWeight: 600,
};
