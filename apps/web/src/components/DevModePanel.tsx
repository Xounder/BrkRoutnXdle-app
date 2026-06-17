import React, { useState } from "react";

interface DevModePanelProps {
  isOpen: boolean;
  onClose: () => void;
  enabled: boolean;
  token: string | null;
  onToggleEnabled: (enabled: boolean) => void;
  onUpdateToken: (token: string) => void;
}

export function DevModePanel({ isOpen, onClose, enabled, token, onToggleEnabled, onUpdateToken }: DevModePanelProps) {
  const [draft, setDraft] = useState(token ?? "");

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        right: "16px",
        width: "360px",
        padding: "24px",
        background: "#FFF8E7",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.16)",
        zIndex: 1000,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, color: "#1E8C86" }}>Dev Mode</h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "20px",
            color: "#666",
          }}
        >
          ×
        </button>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggleEnabled(e.target.checked)}
        />
        <span>Enable Dev Mode Bypass</span>
      </label>

      {enabled && (
        <div>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#555" }}>
            OAuth Playground Token
          </label>
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              e.target.value && onUpdateToken(e.target.value);
            }}
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
            }}
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              onClick={() => location.reload()}
              style={{
                flex: 1,
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 700,
                background: "#2BA8A2",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Recarregar e aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}