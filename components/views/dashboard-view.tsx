"use client";
import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Cpu,
  Wrench,
  Search,
  ScanSearch,
  MessageSquareText,
  Activity,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Terminal,
  Database,
  Lock,
} from "lucide-react";
import { getAgentHealth, getAgentTools, apiUrl } from "@/lib/api";
import type { AgentHealthResponse, AgentToolsResponse, AuthUser } from "@/lib/types";

interface DashboardViewProps {
  user: AuthUser;
  onNavigate: (view: any) => void;
  online: boolean | null;
}

export function DashboardView({ user, onNavigate, online }: DashboardViewProps) {
  const [health, setHealth] = useState<AgentHealthResponse | null>(null);
  const [tools, setTools] = useState<AgentToolsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, t] = await Promise.allSettled([getAgentHealth(), getAgentTools()]);
      if (h.status === "fulfilled") setHealth(h.value);
      if (t.status === "fulfilled") setTools(t.value);
    } catch (err: any) {
      setError(err?.message || "Failed to load live system status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
  }, []);

  const availableProviders = health?.providers
    ? Object.entries(health.providers).filter(([_, s]) => s === "available")
    : [];

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="eyebrow">DEFENSIVE THREAT INTELLIGENCE WORKSPACE</div>
          <h1>
            Welcome back, <span>{user.full_name || "Analyst"}</span>
          </h1>
          <p>
            Connected to your defensive RAG pipeline, single-step security agent, and
            evidence triage screening engine.
          </p>
          <div className="hero-actions">
            <button
              className="btn btn-primary"
              onClick={() => onNavigate("chat")}
            >
              <MessageSquareText size={16} />
              <span>Start Security Chat</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate("cve")}
            >
              <Search size={16} />
              <span>Analyze a CVE</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate("screening")}
            >
              <ScanSearch size={16} />
              <span>Screen Evidence</span>
            </button>
          </div>
        </div>

        <div className="hero-badge-box">
          <div className="system-status-indicator">
            <span
              className={`status-dot ${
                online ? "online" : online === false ? "offline" : "pending"
              }`}
            />
            <span className="status-label">
              {online ? "SYSTEM OPERATIONAL" : online === false ? "BACKEND OFFLINE" : "CHECKING API"}
            </span>
          </div>
          <div className="analyst-tag">
            <Lock size={13} />
            <span>Authenticated via {user.auth_provider === "google" ? "Google OAuth" : "Credentials"}</span>
          </div>
        </div>
      </div>

      {/* Live System Metrics Grid */}
      <div className="section-title-row">
        <h3>Live System Telemetry</h3>
        <button
          className="refresh-btn"
          onClick={fetchLiveStatus}
          disabled={loading}
          title="Refresh live system status"
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon blue">
              <ShieldCheck size={20} />
            </span>
            <span className="metric-badge">FastAPI Core</span>
          </div>
          <div className="metric-value">
            {online ? "Connected" : online === false ? "Offline" : "Checking"}
          </div>
          <div className="metric-label">Backend API Status</div>
          <div className="metric-footnote">Port 8000 / Render Cloud</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon cyan">
              <Cpu size={20} />
            </span>
            <span className="metric-badge">LLM Fallback</span>
          </div>
          <div className="metric-value">
            {availableProviders.length ? `${availableProviders.length} Online` : "Configured"}
          </div>
          <div className="metric-label">Available LLM Providers</div>
          <div className="metric-footnote">
            {availableProviders.map(([name]) => name).join(", ") || "Groq, Mistral, Gemini, NVIDIA"}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon orange">
              <Wrench size={20} />
            </span>
            <span className="metric-badge">Tool Registry</span>
          </div>
          <div className="metric-value">
            {tools?.count ?? 10} Active
          </div>
          <div className="metric-label">Security Tools Registered</div>
          <div className="metric-footnote">CVE, KEV, MITRE, RAG & Forensics</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon green">
              <Database size={20} />
            </span>
            <span className="metric-badge">pgvector</span>
          </div>
          <div className="metric-value">768 Dim</div>
          <div className="metric-label">Supabase Vector DB</div>
          <div className="metric-footnote">Hybrid Keyword + Vector Search</div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="section-title-row">
        <h3>Investigation Modules</h3>
      </div>

      <div className="action-cards-grid">
        <div className="action-card" onClick={() => onNavigate("chat")}>
          <div className="action-card-header">
            <div className="action-icon blue">
              <MessageSquareText size={22} />
            </div>
            <ArrowRight size={18} className="action-arrow" />
          </div>
          <h4>Threat Intelligence Chat</h4>
          <p>
            Engage with the defensive RAG assistant. Query known CVEs, analyze attack vectors,
            and inspect technical mitigations with verified citations.
          </p>
          <span className="action-link">Open Chat Session</span>
        </div>

        <div className="action-card" onClick={() => onNavigate("cve")}>
          <div className="action-card-header">
            <div className="action-icon purple">
              <Search size={22} />
            </div>
            <ArrowRight size={18} className="action-arrow" />
          </div>
          <h4>CVE & KEV Explainer</h4>
          <p>
            Inspect specific vulnerability records. Decodes CVSS v3 vectors, checks CISA
            Known Exploited Vulnerabilities catalog, and pulls actionable patches.
          </p>
          <span className="action-link">Launch CVE Explainer</span>
        </div>

        <div className="action-card" onClick={() => onNavigate("screening")}>
          <div className="action-card-header">
            <div className="action-icon orange">
              <ScanSearch size={22} />
            </div>
            <ArrowRight size={18} className="action-arrow" />
          </div>
          <h4>Vulnerability & File Scanner</h4>
          <p>
            Upload evidence files (PDF, LOG, JSON, TXT) or paste raw terminal output.
            Detects prompt injection, calculates risk scores (0-100), and parses IOCs.
          </p>
          <span className="action-link">Upload Evidence</span>
        </div>

        <div className="action-card" onClick={() => onNavigate("tools")}>
          <div className="action-card-header">
            <div className="action-icon cyan">
              <Wrench size={22} />
            </div>
            <ArrowRight size={18} className="action-arrow" />
          </div>
          <h4>Security Agent Tools</h4>
          <p>
            Inspect all 10 registered security tools available to the LangChain autonomous
            agent workflow, including MITRE ATT&CK and threat enrichment.
          </p>
          <span className="action-link">Inspect Agent Tools</span>
        </div>
      </div>

      {/* Connected Integrations & Documentation Footer */}
      <div className="dashboard-footer-panel">
        <div className="footer-left">
          <Terminal size={18} className="accent-blue" />
          <div>
            <h5>FastAPI Security Operations Center Backend</h5>
            <p>
              Operating with Server-Sent Events (SSE) streaming and LangChain agentic routing.
            </p>
          </div>
        </div>
        <div className="footer-right">
          <a
            href={apiUrl("/docs")}
            target="_blank"
            rel="noreferrer"
            className="doc-link"
          >
            <span>Interactive OpenAPI Docs</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
