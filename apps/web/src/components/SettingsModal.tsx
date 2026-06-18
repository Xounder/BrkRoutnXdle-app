import React, { useMemo, useState } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { DEFAULT_SETTINGS } from "@brkroutnxdle/shared";
import type { Settings } from "@brkroutnxdle/shared";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [use12h, setUse12h] = useState(false);

  const clampHour = (value: number): number => Math.max(0, Math.min(23, value));

  const to12h = (h: number) => {
    const m = h % 12;
    return m === 0 ? 12 : m;
  };
  const ampm = (h: number) => (h < 12 ? "AM" : "PM");

  const timezoneOptions = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      // Fallback for older browsers that don't support Intl.supportedValuesOf
      return [
        "UTC",
        "America/New_York",
        "America/Chicago",
        "America/Denver",
        "America/Los_Angeles",
        "Europe/London",
        "Europe/Paris",
        "Europe/Berlin",
        "Europe/Moscow",
        "Asia/Tokyo",
        "Asia/Shanghai",
        "Asia/Kolkata",
        "Australia/Sydney",
        "Pacific/Auckland",
      ];
    }
  }, []);

  if (!isOpen) return null;

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
    width: "440px",
    maxWidth: "90vw",
    boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, color: "#1E8C86" }}>Settings</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px" }}>
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 12h / 24h toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
            <input
              type="checkbox"
              checked={use12h}
              onChange={(e) => setUse12h(e.target.checked)}
            />
            Use 12-hour format (AM/PM)
          </label>

          {/* Work Start Hour / Work End Hour */}
          <div style={{ display: "flex", gap: "16px" }}>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>Available Start Hour</span>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={settings.workStartHour}
                  onChange={(e) => {
                    const raw = parseInt(e.target.value, 10);
                    const clamped = clampHour(raw);
                    updateSettings({ workStartHour: clamped, workEndHour: Math.max(clamped, settings.workEndHour) });
                  }}
                  style={{ ...inputStyle, flex: 1 }}
                />
                {use12h && (
                  <span style={{ fontSize: "13px", color: "#666", whiteSpace: "nowrap", minWidth: "52px" }}>
                    {to12h(settings.workStartHour)} {ampm(settings.workStartHour)}
                  </span>
                )}
              </div>
            </label>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>Available End Hour</span>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={settings.workEndHour}
                  onChange={(e) => {
                    const raw = parseInt(e.target.value, 10);
                    const clamped = clampHour(raw);
                    updateSettings({ workEndHour: clamped, workStartHour: Math.min(clamped, settings.workStartHour) });
                  }}
                  style={{ ...inputStyle, flex: 1 }}
                />
                {use12h && (
                  <span style={{ fontSize: "13px", color: "#666", whiteSpace: "nowrap", minWidth: "52px" }}>
                    {to12h(settings.workEndHour)} {ampm(settings.workEndHour)}
                  </span>
                )}
              </div>
            </label>
          </div>

          {/* Max Tasks Per Day / Default Task Duration */}
          <div style={{ display: "flex", gap: "16px" }}>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>Max Tasks Per Day</span>
              <input
                type="number"
                min={1}
                max={20}
                value={settings.maxTasksPerDay}
                onChange={(e) => updateSettings({ maxTasksPerDay: parseInt(e.target.value, 10) })}
                style={inputStyle}
              />
            </label>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>Default Task Duration (min)</span>
              <select
                value={settings.defaultTaskDuration}
                onChange={(e) => updateSettings({ defaultTaskDuration: parseInt(e.target.value, 10) })}
                style={inputStyle}
              >
                {[30, 60, 90, 120, 150, 180].map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </label>
          </div>

          {/* Work Days */}
          <fieldset style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "12px" }}>
            <legend style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>Work Days</legend>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                <label key={day} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
                  <input
                    type="checkbox"
                    checked={settings.workDays.includes(i)}
                    onChange={() => {
                      const next = settings.workDays.includes(i)
                        ? settings.workDays.filter((d) => d !== i)
                        : [...settings.workDays, i].sort();
                      updateSettings({ workDays: next });
                    }}
                  />
                  {day}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Timezone */}
          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>Timezone</span>
            <select
              value={settings.timezone}
              onChange={(e) => updateSettings({ timezone: e.target.value })}
              style={inputStyle}
            >
              {timezoneOptions.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
            <button onClick={resetSettings} style={secondaryButtonStyle}>
              Reset to Defaults
            </button>
            <button onClick={onClose} style={primaryButtonStyle}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "2px solid #ddd",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "10px 32px",
  background: "linear-gradient(135deg, #FFD23F, #E6B800)",
  border: "none",
  borderRadius: "9999px",
  fontWeight: 700,
  cursor: "pointer",
  color: "#1E8C86",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 24px",
  border: "2px solid #2BA8A2",
  borderRadius: "9999px",
  background: "transparent",
  color: "#2BA8A2",
  cursor: "pointer",
  fontWeight: 600,
};
