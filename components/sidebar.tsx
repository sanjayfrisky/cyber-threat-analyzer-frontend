"use client";
import { Shield, MessageSquareText, ScanSearch, Activity, CircleHelp, LogOut, User } from "lucide-react";
import { API_BASE, apiUrl } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

export type View = "overview" | "chat" | "screening";

export function Sidebar({
  active,
  onChange,
  backendOnline,
  user,
  onLogout,
}: {
  active: View;
  onChange: (view: View) => void;
  backendOnline: boolean | null;
  user?: AuthUser | null;
  onLogout?: () => void;
}) {
  const items: { id: View; label: string; icon: typeof Activity }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "chat", label: "Threat intelligence chat", icon: MessageSquareText },
    { id: "screening", label: "Evidence screening", icon: ScanSearch }
  ];

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CT";

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Shield size={21} />
        </div>
        <div>
          <b>
            CYBER<span>INTEL</span>
          </b>
          <small>RAG CONSOLE</small>
        </div>
      </div>

      <div className="nav-label">WORKSPACE</div>
      <nav>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`nav-item ${active === item.id ? "active" : ""}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {user && (
        <div className="sidebar-user-section">
          <div className="nav-label">AUTHENTICATED ANALYST</div>
          <div className="user-profile-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-meta">
              <span className="user-name">{user.full_name}</span>
              <span className="user-email">{user.email}</span>
            </div>
            {onLogout && (
              <button
                type="button"
                className="user-logout-btn"
                onClick={onLogout}
                title="Sign out from security console"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="sidebar-bottom">
        <div className="connection">
          <span
            className={`dot ${
              backendOnline ? "online" : backendOnline === false ? "offline" : ""
            }`}
          />
          <div>
            <b>
              {backendOnline
                ? "Backend connected"
                : backendOnline === false
                ? "Backend unavailable"
                : "Checking backend"}
            </b>
            <small>{API_BASE.replace(/^https?:\/\//, "")}</small>
          </div>
        </div>
        <div className="help-note">
          <CircleHelp size={16} />
          <span>
            API documentation
            <br />
            <a href={apiUrl("/docs")} target="_blank" rel="noreferrer">
              Open Swagger UI ↗
            </a>
          </span>
        </div>
      </div>
    </aside>
  );
}