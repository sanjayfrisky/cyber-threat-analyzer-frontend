"use client";
import React, { useState, useEffect } from "react";
import {
  Shield,
  LogOut,
  Bell,
  Cpu,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Sidebar, type View } from "@/components/sidebar";
import { DashboardView } from "@/components/views/dashboard-view";
import { CveAnalysisView } from "@/components/views/cve-analysis-view";
import { McpToolsView } from "@/components/views/mcp-tools-view";
import { IntegrationsView } from "@/components/views/integrations-view";
import { SettingsView } from "@/components/views/settings-view";
import { HistoryView } from "@/components/views/history-view";
import { ChatPanel } from "@/components/chat-panel";
import { ScreeningPanel } from "@/components/screening-panel";
import { AuthView } from "@/components/auth-view";
import { checkBackend, apiUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [active, setActive] = useState<View>("dashboard");
  const [online, setOnline] = useState<boolean | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const ok = await checkBackend();
      if (alive) setOnline(ok);
    };
    check();
    const timer = setInterval(check, 15000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  // 1. Loading screen while verifying token / session
  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-box">
          <div className="brand-mark large pulse">
            <Shield size={32} />
          </div>
          <h3>SECURING WORKSPACE</h3>
          <p>Verifying analyst credentials & session integrity...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state: show cybersecurity Login / Register UI
  if (!user) {
    return <AuthView initialMode="login" />;
  }

  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CT";

  return (
    <main className={`saas-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* SaaS Collapsible Sidebar */}
      <Sidebar
        active={active}
        onChange={setActive}
        backendOnline={online}
        user={user}
        onLogout={logout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main SaaS Workspace */}
      <div className="saas-main-area">
        {/* Top Header Bar */}
        <header className="saas-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Open sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <div className="breadcrumb-nav">
              <span className="breadcrumb-root">CyberIntel</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">
                {active.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-status-badge">
              <span
                className={`dot-indicator ${
                  online ? "online" : online === false ? "offline" : "pending"
                }`}
              />
              <span>{online ? "Engine Active" : "Backend Disconnected"}</span>
            </div>

            <div className="analyst-chip">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="topbar-avatar" />
              ) : (
                <span className="user-badge">{initials}</span>
              )}
              <span className="analyst-name">{user.full_name}</span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="topbar-logout-btn"
              title="Sign out from security console"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Dynamic SaaS Page Content */}
        <div className="saas-content-area">
          {active === "dashboard" && (
            <DashboardView user={user} onNavigate={setActive} online={online} />
          )}

          {active === "chat" && (
            <div className="chat-view-wrapper">
              <ChatPanel initialSessionId={selectedSessionId} />
            </div>
          )}

          {active === "history" && (
            <HistoryView
              onNewChat={() => {
                setSelectedSessionId(`session-${Date.now()}`);
                setActive("chat");
              }}
              onSelectSession={(sid) => {
                setSelectedSessionId(sid);
                setActive("chat");
              }}
            />
          )}

          {active === "cve" && <CveAnalysisView />}

          {active === "screening" && (
            <div className="screening-view-wrapper">
              <ScreeningPanel />
            </div>
          )}

          {active === "tools" && <McpToolsView />}

          {active === "integrations" && <IntegrationsView />}

          {active === "settings" && (
            <SettingsView user={user} onLogout={logout} />
          )}
        </div>
      </div>
    </main>
  );
}
