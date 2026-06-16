import React, { useState, useEffect } from "react";

interface DevModePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DevModePanel({ isOpen, onClose }: DevModePanelProps) {
  const [token, setToken] = useState(() =>
    sessionStorage.getItem("brkroutnxdle:devToken") ?? "",
  );
  const [enabled, setEnabled] = useState(() =>
    sessionStorage.getItem("brkroutnxdle:devMode") === "true",
  );

  useEffect(() => {
    if (enabled && token) {
      sessionStorage.setItem("brkroutnxdle:devToken", token);
    } else {
      sessionStorage.removeItem("brkroutnxdle:devToken");
    }
    sessionStorage.setItem("brkroutnxdle:devMode", String(enabled));
  }, [enabled, token]);

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
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <span>Enable Dev Mode Bypass</span>
      </label>

      {enabled && (
        <div>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#555" }}>
            OAuth Playground Token
          </label>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
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
          <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
            Token is stored in sessionStorage and sent as X-Dev-Access-Token header.
          </p>
        </div>
      )}
    </div>
  );
}