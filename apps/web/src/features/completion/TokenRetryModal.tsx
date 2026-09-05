import React, { useEffect, useState } from "react";
import { Modal } from "@brkroutnxdle/ui";
import { useDevModeContext } from "../../contexts/DevModeContext";

interface TokenRetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

const primaryButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: "8px 16px",
  fontSize: "13px",
  fontWeight: 700,
  background: "#2BA8A2",
  border: "none",
  borderRadius: "8px",
  color: "#fff",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: "8px 16px",
  fontSize: "13px",
  fontWeight: 700,
  background: "transparent",
  border: "2px solid #2BA8A2",
  borderRadius: "8px",
  color: "#2BA8A2",
  cursor: "pointer",
};

export function TokenRetryModal({ isOpen, onClose, onRetry }: TokenRetryModalProps) {
  const { updateToken } = useDevModeContext();
  const [insertMode, setInsertMode] = useState(false);
  const [draftToken, setDraftToken] = useState("");

  useEffect(() => {
    if (isOpen) {
      setInsertMode(false);
      setDraftToken("");
    }
  }, [isOpen]);

  const handleRetry = () => {
    onRetry();
    onClose();
  };

  const handleApply = () => {
    const trimmed = draftToken.trim();
    if (!trimmed) return;
    updateToken(trimmed);
    onRetry();
    onClose();
  };

  const canSubmit = draftToken.trim().length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Google token expired">
      {insertMode ? (
        <>
          <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#555" }}>
            Insert a valid Google OAuth token to retry the calendar sync.
          </p>
          <textarea
            value={draftToken}
            onChange={(e) => setDraftToken(e.target.value)}
            placeholder="Paste your Google OAuth Playground token here..."
            rows={3}
            style={{
              width: "100%",
              padding: "8px",
              border: "2px solid #2BA8A2",
              borderRadius: "8px",
              fontFamily: "monospace",
              fontSize: "12px",
              resize: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button onClick={() => setInsertMode(false)} style={secondaryButtonStyle}>
              Back
            </button>
            <button
              onClick={handleApply}
              disabled={!canSubmit}
              style={{ ...primaryButtonStyle, opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? "pointer" : "not-allowed" }}
            >
              {"Apply & retry"}
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 600, color: "#721c24" }}>
            Google token expired. Please re-authenticate.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setInsertMode(true)} style={primaryButtonStyle}>
              Insert another token
            </button>
            <button onClick={handleRetry} style={secondaryButtonStyle}>
              Retry
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}