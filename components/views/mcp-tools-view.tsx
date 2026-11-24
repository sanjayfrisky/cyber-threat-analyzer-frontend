"use client";
import React, { useEffect, useState } from "react";
import {
  Wrench,
  Search,
  ExternalLink,
  Cpu,
  RefreshCw,
  Terminal,
  CheckCircle2,
  Sliders,
  Code2,
} from "lucide-react";
import { getAgentTools } from "@/lib/api";
import type { AgentToolsResponse, AgentToolMeta } from "@/lib/types";

export function McpToolsView({ onSelectTool }: { onSelectTool?: (toolName: string) => void }) {
  const [toolsData, setToolsData] = useState<AgentToolsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedTool, setSelectedTool] = useState<AgentToolMeta | null>(null);

  const fetchTools = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAgentTools();
      setToolsData(data);
      if (data.tools.length > 0 && !selectedTool) {
        setSelectedTool(data.tools[0]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load agent tools.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const filteredTools = toolsData?.tools.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="tools-view-container">
      <div className="view-header">
        <div>
          <div className="eyebrow">AGENT CAPABILITIES & MCP REGISTRY</div>
          <h2>Cybersecurity Tools</h2>
          <p>
            Dynamically loaded from <code>POST /api/agent/tools</code>. Registered tools are
            orchestrated by your LangChain single-step router.
          </p>
        </div>
        <button
          className="refresh-btn"
          onClick={fetchTools}
          disabled={loading}
          title="Refresh tools"
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="tools-search-box">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Filter tools by capability, keyword, or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="tools-count-badge">
          {filteredTools.length} of {toolsData?.count || 10} Tools
        </span>
      </div>

      <div className="tools-layout">
        {/* Tools list */}
        <div className="tools-list">
          {loading ? (
            <div className="tools-loading">
              <RefreshCw size={24} className="spin" />
              <p>Querying tool registry...</p>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="tools-empty">
              <p>No tools matched your search.</p>
            </div>
          ) : (
            filteredTools.map((tool) => (
              <div
                key={tool.name}
                className={`tool-card-item ${
                  selectedTool?.name === tool.name ? "active" : ""
                }`}
                onClick={() => setSelectedTool(tool)}
              >
                <div className="tool-card-top">
                  <span className="tool-name">
                    <Wrench size={15} />
                    <b>{tool.name}</b>
                  </span>
                  <span className="tool-status-dot online" />
                </div>
                <p className="tool-desc">{tool.description}</p>
              </div>
            ))
          )}
        </div>

        {/* Tool parameter detail pane */}
        <div className="tool-detail-pane">
          {selectedTool ? (
            <div className="tool-inspector">
              <div className="inspector-header">
                <div>
                  <span className="badge-pill">REGISTERED TOOL</span>
                  <h3>{selectedTool.name}</h3>
                </div>
              </div>

              <div className="inspector-section">
                <h4>Description & Purpose</h4>
                <p>{selectedTool.description}</p>
              </div>

              <div className="inspector-section">
                <h4>Parameter Schema</h4>
                <div className="code-block">
                  <pre>
                    <code>
                      {JSON.stringify(selectedTool.parameters || {}, null, 2)}
                    </code>
                  </pre>
                </div>
              </div>

              <div className="inspector-note">
                <CheckCircle2 size={16} className="accent-green" />
                <span>
                  This tool is bound to the LangChain Agent router and executes automatically
                  when relevant questions are asked.
                </span>
              </div>
            </div>
          ) : (
            <div className="inspector-empty">
              <Sliders size={32} />
              <p>Select a tool from the list to inspect its schema and execution parameters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
