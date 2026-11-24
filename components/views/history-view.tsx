"use client";
import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Trash2,
  Clock,
  ArrowRight,
  RefreshCw,
  Database,
} from "lucide-react";
import { getChatSessionsApi, deleteSessionApi } from "@/lib/api";

interface SessionMeta {
  id: string;
  title: string;
  created_at: string | null;
  updated_at: string | null;
  message_count: number;
}

export function HistoryView({
  onSelectSession,
  onNewChat,
}: {
  onSelectSession?: (sessionId: string) => void;
  onNewChat?: () => void;
}) {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getChatSessionsApi();
      setSessions(res.sessions || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load cloud chat history from PostgreSQL.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSessionApi(id);
      setSessions((old) => old.filter((s) => s.id !== id));
    } catch (err: any) {
      alert("Failed to delete session: " + err?.message);
    }
  };

  const filtered = sessions.filter(
    (s) =>
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="history-view-container">
      <div className="view-header">
        <div>
          <div className="eyebrow">POSTGRESQL CLOUD CONVERSATIONS</div>
          <h2>Investigation History</h2>
          <p>
            Persisted in your free <b>Supabase PostgreSQL</b> cloud database. Synced across all
            sessions without relying on browser storage.
          </p>
        </div>
        <div className="header-actions-flex">
          <button
            className="refresh-btn"
            onClick={fetchSessions}
            disabled={loading}
            title="Refresh from cloud database"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
          {onNewChat && (
            <button className="btn btn-primary" onClick={onNewChat}>
              <MessageSquare size={16} />
              <span>New Investigation</span>
            </button>
          )}
        </div>
      </div>

      <div className="history-search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search past conversations in Supabase..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="empty-history-box">
          <RefreshCw size={32} className="spin accent-blue" />
          <h4>Fetching conversations from Supabase PostgreSQL...</h4>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-history-box">
          <Database size={36} className="accent-blue" />
          <h4>No cloud conversations saved yet</h4>
          <p>
            When you ask questions in <b>Threat Intelligence Chat</b>, your conversation history will
            be securely recorded into Supabase PostgreSQL and appear here.
          </p>
          {onNewChat && (
            <button className="btn btn-secondary" onClick={onNewChat}>
              Start New Chat
            </button>
          )}
        </div>
      ) : (
        <div className="history-list">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="history-session-card"
              onClick={() => onSelectSession?.(s.id)}
            >
              <div className="session-card-left">
                <div className="session-icon">
                  <MessageSquare size={18} />
                </div>
                <div className="session-info">
                  <h4>{s.title || "Threat Intelligence Inquiry"}</h4>
                  <div className="session-meta">
                    <span>
                      <Clock size={12} />{" "}
                      {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : "Recent"}
                    </span>
                    <span>•</span>
                    <span>{s.message_count} messages</span>
                    <span>•</span>
                    <span className="cloud-badge">Supabase Cloud</span>
                  </div>
                </div>
              </div>

              <div className="session-card-right">
                <button
                  type="button"
                  className="delete-session-btn"
                  onClick={(e) => deleteSession(s.id, e)}
                  title="Delete from PostgreSQL"
                >
                  <Trash2 size={15} />
                </button>
                <ArrowRight size={16} className="open-arrow" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
