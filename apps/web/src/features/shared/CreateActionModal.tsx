import React from "react";

interface CreateActionModalProps {
  start: string;
  end: string;
  onCreateBlock: (start: string, end: string) => void;
  onCreateTask: (start: string, end: string) => void;
  onClose: () => void;
}

function formatTimeDisplay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateDisplay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "24px",
  padding: "32px",
  width: "380px",
  maxWidth: "90vw",
  textAlign: "center",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#1E8C86",
  fontSize: "20px",
  fontWeight: 700,
};

const timeStyle: React.CSSProperties = {
  margin: "0 0 24px",
  color: "#666",
  fontSize: "14px",
};

const buttonGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const blockBtnStyle: React.CSSProperties = {
  padding: "14px 24px",
  background: "linear-gradient(135deg, #EF6C4A, #E04A2F)",
  border: "none",
  borderRadius: "9999px",
  fontWeight: 700,
  fontSize: "16px",
  cursor: "pointer",
  color: "#fff",
};

const taskBtnStyle: React.CSSProperties = {
  padding: "14px 24px",
  background: "linear-gradient(135deg, #2BA8A2, #1E8C86)",
  border: "none",
  borderRadius: "9999px",
  fontWeight: 700,
  fontSize: "16px",
  cursor: "pointer",
  color: "#fff",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "10px 24px",
  border: "2px solid #2BA8A2",
  borderRadius: "9999px",
  background: "transparent",
  color: "#2BA8A2",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "14px",
  marginTop: "8px",
};

export function CreateActionModal({
  start,
  end,
  onCreateBlock,
  onCreateTask,
  onClose,
}: CreateActionModalProps) {
  const sameDay =
    new Date(start).toDateString() === new Date(end).toDateString();

  const timeLabel = sameDay
    ? `${formatDateDisplay(start)}, ${formatTimeDisplay(start)} – ${formatTimeDisplay(end)}`
    : `${formatDateDisplay(start)} ${formatTimeDisplay(start)} – ${formatDateDisplay(end)} ${formatTimeDisplay(end)}`;

  const durationMin = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000,
  );

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={titleStyle}>Create in this slot</h3>
        <p style={timeStyle}>
          {timeLabel} ({durationMin} min)
        </p>

        <div style={buttonGroupStyle}>
          <button
            style={blockBtnStyle}
            onClick={() => onCreateBlock(start, end)}
          >
            Create Block
          </button>
          <button
            style={taskBtnStyle}
            onClick={() => onCreateTask(start, end)}
          >
            Create Task
          </button>
          <button style={cancelBtnStyle} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
