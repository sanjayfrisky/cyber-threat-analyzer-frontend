"use client";
import React, { useState, useEffect } from "react";
import {
  Github,
  Mail,
  HardDrive,
  Slack,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Unlink,
  Link2,
  Wrench,
  AlertTriangle,
  Play,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getIntegrationsApi,
  connectIntegrationApi,
  disconnectIntegrationApi,
  executePluginToolApi,
} from "@/lib/api";
import type { PluginIntegration, ToolExecutionResponse } from "@/lib/types";

export function IntegrationsView() {
  const [plugins, setPlugins] = useState<PluginIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null);

  // Quick test execution modal/state
  const [executingTool, setExecutingTool] = useState<string | null>(null);
  const [execResult, setExecResult] = useState<ToolExecutionResponse | null>(null);

  const fetchPlugins = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getIntegrationsApi();
      setPlugins(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load OAuth plugins.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
    // Check if redirected with query params from backend callback
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get("plugin_status");
      const provider = urlParams.get("provider");
      if (status === "connected") {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleConnect = async (provider: string) => {
    setConnecting(provider);
    setError(null);
    try {
      const res = await connectIntegrationApi(provider);
      if (res.authorization_url) {
        window.location.href = res.authorization_url;
      }
    } catch (err: any) {
      setError(err?.message || `Failed to start ${provider} OAuth flow.`);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (provider: string, name: string) => {
    const ok = window.confirm(`Are you sure you want to disconnect ${name}? Active MCP tools for this provider will be revoked.`);
    if (!ok) return;

    setDisconnecting(provider);
    try {
      await disconnectIntegrationApi(provider);
      await fetchPlugins();
    } catch (err: any) {
      setError(err?.message || `Failed to disconnect ${name}.`);
    } finally {
      setDisconnecting(null);
    }
  };

  const runQuickTest = async (provider: string, toolName: string) => {
    setExecutingTool(toolName);
    setExecResult(null);
    try {
      // Default benign test arguments
      let args: Record<string, any> = {};
      if (toolName === "github.list_repositories") args = { visibility: "all" };
      else if (toolName === "gmail.search_emails") args = { query: "security" };
      else if (toolName === "drive.list_files") args = { page_size: 5 };
      else if (toolName === "slack.list_channels") args = { types: "public_channel" };

      const res = await executePluginToolApi(provider, toolName, args, false);
      setExecResult(res);
    } catch (err: any) {
      setExecResult({ success: false, tool_name: toolName, error: err?.message });
    } finally {
      setExecutingTool(null);
    }
  };

  const getProviderIcon = (iconName: string) => {
    switch (iconName) {
      case "github":
        return <Github size={26} className="text-white" />;
      case "mail":
        return <Mail size={26} className="text-red-400" />;
      case "hard-drive":
        return <HardDrive size={26} className="text-blue-400" />;
      case "slack":
        return <Slack size={26} className="text-purple-400" />;
      default:
        return <Link2 size={26} className="text-blue-400" />;
    }
  };

  return (
    <div className="integrations-view-container">
      <div className="view-header">
        <div>
          <div className="eyebrow">CENTRALIZED OAUTH PLUGINS & MCP TOOLS</div>
          <h2>External Integrations</h2>
          <p>
            Connect GitHub, Gmail, Google Drive, and Slack to your defensive cybersecurity
            assistant with fine-grained OAuth 2.0 authorization.
          </p>
        </div>
        <button className="refresh-btn" onClick={fetchPlugins} disabled={loading} title="Refresh statuses">
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="auth-alert error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of exactly 4 integration cards */}
      <div className="plugin-cards-grid">
        {plugins.map((p) => {
          const isBusy = connecting === p.provider || disconnecting === p.provider;
          const isExpanded = expandedPlugin === p.provider;

          return (
            <div key={p.provider} className={`plugin-card ${p.is_connected ? "connected" : ""}`}>
              <div className="plugin-card-header">
                <div className="plugin-icon-box">{getProviderIcon(p.icon)}</div>
                <div className="plugin-status-badge-wrap">
                  {p.is_connected ? (
                    <span className="status-pill-connected">
                      <CheckCircle2 size={13} /> Connected
                    </span>
                  ) : (
                    <span className="status-pill-disconnected">
                      <XCircle size={13} /> Disconnected
                    </span>
                  )}
                </div>
              </div>

              <div className="plugin-card-body">
                <h3>{p.name}</h3>
                <p>{p.description}</p>

                {/* Account info if connected */}
                {p.is_connected && p.account_info && Object.keys(p.account_info).length > 0 && (
                  <div className="plugin-account-info">
                    <span className="account-label">Linked Account:</span>
                    <span className="account-value">
                      {p.account_info.login || p.account_info.email || p.account_info.team_name || "Authorized"}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="plugin-card-actions">
                {p.is_connected ? (
                  <div className="connected-btn-group">
                    <button
                      type="button"
                      className="btn-disconnect"
                      onClick={() => handleDisconnect(p.provider, p.name)}
                      disabled={isBusy}
                    >
                      <Unlink size={14} />
                      <span>{disconnecting === p.provider ? "Revoking..." : "Disconnect"}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-configure"
                      onClick={() => setExpandedPlugin(isExpanded ? null : p.provider)}
                    >
                      <Wrench size={14} />
                      <span>{isExpanded ? "Hide Tools" : "Tools"}</span>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-connect"
                    onClick={() => handleConnect(p.provider)}
                    disabled={isBusy}
                  >
                    <Link2 size={15} />
                    <span>{connecting === p.provider ? "Authorizing..." : `Connect ${p.name}`}</span>
                  </button>
                )}
              </div>

              {/* Expandable tool list for connected plugin */}
              {isExpanded && p.is_connected && (
                <div className="plugin-tools-drawer">
                  <div className="tools-drawer-header">
                    <span className="text-xs uppercase font-bold text-muted">Bound MCP Tools</span>
                  </div>
                  <div className="tools-drawer-list">
                    {p.available_tools.map((tool) => (
                      <div key={tool} className="tool-drawer-item">
                        <code>{tool}</code>
                        <button
                          type="button"
                          className="run-test-btn"
                          onClick={() => runQuickTest(p.provider, tool)}
                          disabled={Boolean(executingTool)}
                          title="Run benign test query"
                        >
                          <Play size={11} /> Test
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Execution Test Result Modal / Drawer */}
      {execResult && (
        <div className="plugin-test-result-box">
          <div className="result-box-header">
            <h4>Tool Execution Result: <code>{execResult.tool_name}</code></h4>
            <button className="close-result-btn" onClick={() => setExecResult(null)}>×</button>
          </div>
          {execResult.requires_confirmation ? (
            <div className="confirmation-prompt-box">
              <AlertTriangle size={18} className="text-orange-400" />
              <div>
                <b>Analyst Approval Required:</b>
                <p>{execResult.confirmation_prompt}</p>
              </div>
            </div>
          ) : execResult.success ? (
            <pre className="result-code-block">{JSON.stringify(execResult.result, null, 2)}</pre>
          ) : (
            <div className="auth-alert error">
              <span>{execResult.error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
