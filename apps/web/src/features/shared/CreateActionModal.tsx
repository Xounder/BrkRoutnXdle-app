import React, { useState } from "react";

const DURATIONS = [30, 60, 90, 120, 150, 180];

interface CreateActionModalProps {
  start: string;
  end: string;
  onCreateBlock: (start: string, end: string) => void;
  onCreateTaskInline?: (name: string, duration: number, start: string, end: string) => void;
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

const formGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginBottom: "16px",
  textAlign: "left",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#333",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "14px",
  width: "100%",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "14px",
  width: "100%",
  boxSizing: "border-box",
  background: "#fff",
};

const errorStyle: React.CSSProperties = {
  color: "#d32f2f",
  fontSize: "13px",
  margin: "0 0 8px",
};

const submitBtnStyle: React.CSSProperties = {
  padding: "14px 24px",
  background: "linear-gradient(135deg, #2BA8A2, #1E8C86)",
  border: "none",
  borderRadius: "9999px",
  fontWeight: 700,
  fontSize: "16px",
  cursor: "pointer",
  color: "#fff",
};

export function CreateActionModal({
  start,
  end,
  onCreateBlock,
  onCreateTaskInline,
  onClose,
}: CreateActionModalProps) {
  const [mode, setMode] = useState<"menu" | "form">("menu");
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(() => {
    const min = Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / 60000,
    );
    return DURATIONS.reduce((prev, curr) =>
      Math.abs(curr - min) < Math.abs(prev - min) ? curr : prev
    );
  });
  const [error, setError] = useState<string | null>(null);

  const sameDay =
    new Date(start).toDateString() === new Date(end).toDateString();

  const timeLabel = sameDay
    ? `${formatDateDisplay(start)}, ${formatTimeDisplay(start)} – ${formatTimeDisplay(end)}`
    : `${formatDateDisplay(start)} ${formatTimeDisplay(start)} – ${formatDateDisplay(end)} ${formatTimeDisplay(end)}`;

  const durationMin = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Task name is required");
      return;
    }
    if (!DURATIONS.includes(duration)) {
      setError("Duration must be 30, 60, 90, 120, 150, or 180 minutes");
      return;
    }

    onCreateTaskInline?.(name.trim(), duration, start, end);
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={titleStyle}>Create in this slot</h3>
        <p style={timeStyle}>
          {timeLabel} ({durationMin} min)
        </p>

        {mode === "menu" ? (
          <div style={buttonGroupStyle}>
            <button
              style={blockBtnStyle}
              onClick={() => onCreateBlock(start, end)}
            >
              Create Block
            </button>
            <button
              style={taskBtnStyle}
              onClick={() => setMode("form")}
            >
              Create Task
            </button>
            <button style={cancelBtnStyle} onClick={onClose}>
              Cancel
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="task-name">Name</label>
              <input
                id="task-name"
                style={inputStyle}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Task name"
                autoFocus
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="task-duration">Duration (minutes)</label>
              <select
                id="task-duration"
                style={selectStyle}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </div>

            {error && <p style={errorStyle}>{error}</p>}

            <div style={buttonGroupStyle}>
              <button type="submit" style={submitBtnStyle}>
                Create Task
              </button>
              <button
                type="button"
                style={cancelBtnStyle}
                onClick={() => {
                  setMode("menu");
                  setError(null);
                  setName("");
                  setDuration(
                    DURATIONS.reduce((prev, curr) =>
                      Math.abs(curr - durationMin) < Math.abs(prev - durationMin) ? curr : prev
                    )
                  );
                }}
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
