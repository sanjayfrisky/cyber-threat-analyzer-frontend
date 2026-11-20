"use client";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Database,
  LogOut,
  MessageSquareText,
  ScanSearch,
  Shield,
  ShieldCheck,
  TerminalSquare,
  Loader2,
} from "lucide-react";
import { Sidebar, type View } from "@/components/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { ScreeningPanel } from "@/components/screening-panel";
import { AuthView } from "@/components/auth-view";
import { checkBackend, apiUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [active, setActive] = useState<View>("overview");
  const [online, setOnline] = useState<boolean | null>(null);
  const [apiPaths, setApiPaths] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const ok = await checkBackend();
      if (alive) setOnline(ok);
      if (ok) {
        try {
          const r = await fetch(apiUrl("/openapi.json"), { cache: "no-store" });
          const spec = await r.json();
          if (alive) setApiPaths(Object.keys(spec.paths || {}));
        } catch {
          /* connection badge already reports API availability */
        }
      }
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

  // 2. Unauthenticated state: show professional cybersecurity Login / Register UI
  if (!user) {
    return <AuthView initialMode="login" />;
  }

  // Calculate initials for analyst badge
  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CT";

  // 3. Authenticated state: render full dashboard
  return (
    <main className="app-shell">
      <Sidebar
        active={active}
        onChange={setActive}
        backendOnline={online}
        user={user}
        onLogout={logout}
      />
      <div className="main-area">
        <header className="topbar">
          <div>
            <span className="topbar-dot" /> SECURITY OPERATIONS WORKSPACE
          </div>
          <div className="topbar-right">
            <span className="environment">LOCAL DEVELOPMENT</span>
            <div className="analyst-chip">
              <span className="user-badge">{initials}</span>
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

        <div className="content">
          {active === "overview" ? (
            <>
              <div className="page-title">
                <div>
                  <div className="eyebrow">CYBER THREAT INTELLIGENCE</div>
                  <h1>Security overview</h1>
                  <p>Your workspace for threat intelligence Q&A and evidence triage.</p>
                </div>
                <div
                  className={`status-pill ${
                    online ? "good" : online === false ? "bad" : ""
                  }`}
                >
                  <span className="dot" />
                  {online ? "API online" : online === false ? "API offline" : "Checking API"}
                </div>
              </div>

              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-icon blue">
                    <ShieldCheck size={19} />
                  </div>
                  <small>BACKEND API</small>
                  <b>{online ? "Connected" : online === false ? "Disconnected" : "Checking"}</b>
                  <span>FastAPI service</span>
                </div>
                <div className="stat-card">
                  <div className="stat-icon violet">
                    <MessageSquareText size={19} />
                  </div>
                  <small>CHAT SERVICE</small>
                  <b>Available</b>
                  <span>POST /api/chat</span>
                </div>
                <div className="stat-card">
                  <div className="stat-icon orange">
                    <ScanSearch size={19} />
                  </div>
                  <small>SCREENING</small>
                  <b>Available</b>
                  <span>POST /api/screening</span>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">
                    <Database size={19} />
                  </div>
                  <small>DATA INGESTION</small>
                  <b>Backend route absent</b>
                  <span>Not exposed in this code version</span>
                </div>
              </div>

              <div className="section-heading">
                <div>
                  <h2>Investigation tools</h2>
                  <p>Choose a workflow to get started.</p>
                </div>
              </div>

              <div className="tool-grid">
                <button className="tool-card" onClick={() => setActive("chat")}>
                  <div className="tool-icon blue">
                    <MessageSquareText size={22} />
                  </div>
                  <h3>Threat intelligence chat</h3>
                  <p>
                    Ask about CVEs, vulnerabilities, threat intelligence and remediation guidance.
                  </p>
                  <span>
                    Open chat <ArrowUpRight size={16} />
                  </span>
                </button>
                <button className="tool-card" onClick={() => setActive("screening")}>
                  <div className="tool-icon orange">
                    <ScanSearch size={22} />
                  </div>
                  <h3>Evidence screening</h3>
                  <p>Analyze suspicious text, commands, logs and supported evidence files.</p>
                  <span>
                    Open screening <ArrowUpRight size={16} />
                  </span>
                </button>
              </div>

              <div className="panel api-panel">
                <div className="api-title">
                  <TerminalSquare size={19} />
                  <div>
                    <h3>Detected backend routes</h3>
                    <p>Read from the FastAPI OpenAPI document.</p>
                  </div>
                </div>
                <div className="route-list">
                  {apiPaths.length ? (
                    apiPaths.map((path) => <span key={path}>{path}</span>)
                  ) : (
                    <span className="muted">Connect the backend to load route details.</span>
                  )}
                </div>
                <a href={apiUrl("/docs")} target="_blank" rel="noreferrer">
                  View interactive API docs ↗
                </a>
              </div>

              <p className="footer-note">
                <Shield size={14} /> CyberIntel RAG Console · Frontend communicates with your
                existing FastAPI backend.
              </p>
            </>
          ) : active === "chat" ? (
            <>
              <div className="page-title compact">
                <div>
                  <div className="eyebrow">WORKSPACE / CHAT</div>
                  <h1>Threat intelligence chat</h1>
                  <p>Evidence-grounded cybersecurity assistance.</p>
                </div>
              </div>
              <ChatPanel />
            </>
          ) : (
            <>
              <div className="page-title compact">
                <div>
                  <div className="eyebrow">WORKSPACE / SCREENING</div>
                  <h1>Evidence screening</h1>
                  <p>Analyze suspicious indicators, commands and files.</p>
                </div>
              </div>
              <ScreeningPanel />
            </>
          )}
        </div>
      </div>
    </main>
  );
}