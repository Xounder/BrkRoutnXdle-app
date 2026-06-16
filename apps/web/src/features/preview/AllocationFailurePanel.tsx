import React from "react";
import type { AllocationFailure } from "@brkroutnxdle/domain";

interface AllocationFailurePanelProps {
  failures: AllocationFailure[];
  onDismiss: () => void;
}

export function AllocationFailurePanel({ failures, onDismiss }: AllocationFailurePanelProps) {
  if (failures.length === 0) return null;

  return (
    <div
      style={{
        padding: "16px",
        background: "#FFF5F0",
        borderRadius: "16px",
        border: "2px solid #EF6C4A",
        boxShadow: "0 4px 20px rgba(239,108,74,0.35)",
        margin: "12px 0",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h4 style={{ margin: 0, color: "#D45233", fontSize: "15px" }}>
          Allocation Warning
        </h4>
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#D45233" }}
        >
          &times;
        </button>
      </div>

      <p style={{ fontSize: "13px", color: "#666", margin: "0 0 12px" }}>
        Some tasks could not be fully allocated. You can still save the partial schedule or adjust tasks and regenerate.
      </p>

      {failures.map((f) => (
        <div
          key={f.taskId}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: "#fff",
            borderRadius: "8px",
            marginBottom: "6px",
            fontSize: "13px",
          }}
        >
          <span style={{ fontWeight: 600, color: "#333" }}>{f.taskName}</span>
          <span style={{ color: "#EF6C4A" }}>
            {f.allocated}/{f.required} allocated
          </span>
        </div>
      ))}

      <p style={{ fontSize: "12px", color: "#999", margin: "8px 0 0", textAlign: "center" }}>
        You can accept this partial allocation or adjust your tasks and try again.
      </p>
    </div>
  );
}
