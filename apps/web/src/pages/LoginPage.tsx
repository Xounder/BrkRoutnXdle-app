import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const { login, authenticated, loading } = useAuth();

  // If already authenticated, the App component will redirect
  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#EFF8F7",
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "#EFF8F7",
      gap: "32px",
    }}>
      <h1 style={{
        fontSize: "48px",
        fontWeight: 800,
        color: "#1E8C86",
        letterSpacing: "0.08em",
        margin: 0,
      }}>
        BrkRoutnXdle
      </h1>
      <p style={{
        fontSize: "16px",
        color: "#555",
        maxWidth: "400px",
        textAlign: "center",
        lineHeight: 1.5,
      }}>
        Generate optimized weekly schedules from your Google Calendar.
        Define tasks, set preferences, and let the algorithm do the rest.
      </p>
      <button
        onClick={login}
        style={{
          padding: "16px 48px",
          fontSize: "18px",
          fontWeight: 700,
          background: "linear-gradient(135deg, #FFD23F, #E6B800)",
          border: "none",
          borderRadius: "9999px",
          color: "#1E8C86",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(255,210,63,0.40)",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        Login with Google
      </button>
    </div>
  );
}