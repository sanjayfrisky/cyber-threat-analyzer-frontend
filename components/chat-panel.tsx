"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import {
  ArrowUp,
  Bot,
  UserRound,
  LoaderCircle,
  RotateCcw,
  Copy,
  Check,
  Database,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

import type { ChatMessage } from "@/lib/types";
import { sendChat, getSessionMessagesApi } from "@/lib/api";

const starter = [
  "Explain CVE-2021-44228 and its remediation",
  "What is the difference between CVSS and exploitability?",
  "How should a SOC analyst triage a suspicious PowerShell command?",
];

interface ChatPanelProps {
  initialSessionId?: string;
  onSessionChange?: (newSessionId: string) => void;
}

export function ChatPanel({ initialSessionId, onSessionChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string>(
    () => initialSessionId || `session-${Date.now()}`
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // When initialSessionId prop updates (e.g. user selected from HistoryView)
  useEffect(() => {
    if (initialSessionId && initialSessionId !== sessionId) {
      setSessionId(initialSessionId);
    }
  }, [initialSessionId]);

  // Load conversation messages directly from Supabase PostgreSQL via backend API
  useEffect(() => {
    let alive = true;
    async function loadCloudMessages() {
      if (!sessionId) return;
      try {
        const res = await getSessionMessagesApi(sessionId);
        if (alive && res.messages && res.messages.length > 0) {
          setMessages(res.messages);
        }
      } catch {
        // If brand new session without DB records yet, leave messages as-is
      }
    }
    loadCloudMessages();
    return () => {
      alive = false;
    };
  }, [sessionId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startNewConversation = () => {
    if (busy) return;
    const newId = `session-${Date.now()}`;
    setSessionId(newId);
    setMessages([]);
    setError("");
    onSessionChange?.(newId);
  };

  async function submit(e?: FormEvent, preset?: string) {
    e?.preventDefault();

    const question = (preset ?? prompt).trim();
    if (!question || busy) return;

    setError("");
    setPrompt("");
    setBusy(true);

    const userMsg: ChatMessage = {
      id: globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role: "user",
      content: question,
    };

    const answerId = globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `ans-${Date.now()}`;

    setMessages((old) => [
      ...old,
      userMsg,
      { id: answerId, role: "assistant", content: "" },
    ]);

    let accumulatedContent = "";

    try {
      await sendChat(question, sessionId, (chunk) => {
        accumulatedContent += chunk;
        setMessages((old) =>
          old.map((m) =>
            m.id === answerId ? { ...m, content: accumulatedContent } : m
          )
        );
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to contact chat service.";
      setError(message);

      setMessages((old) =>
        old.map((m) =>
          m.id === answerId && !m.content
            ? {
                ...m,
                content:
                  "I couldn't complete this request. Check backend connection and API logs.",
              }
            : m
        )
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel chat-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">KNOWLEDGE ASSISTANT · SUPABASE POSTGRESQL</div>
          <h2>Threat intelligence chat</h2>
          <p>
            Persisted in your cloud database. Real-time streaming with verifiable CVE evidence.
          </p>
        </div>

        <button
          className="icon-button"
          title="Start new conversation"
          onClick={startNewConversation}
          disabled={busy}
        >
          <RotateCcw size={17} />
        </button>
      </div>

      <div className="chat-scroll">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-icon">
              <Bot size={28} />
            </div>

            <h3>What would you like to investigate?</h3>
            <p>
              Responses are streamed via Server-Sent Events and automatically synced to your free
              Supabase cloud database.
            </p>

            <div className="suggestions">
              {starter.map((s) => (
                <button key={s} onClick={() => submit(undefined, s)}>
                  {s}
                  <span>↗</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages">
            {messages.map((m) => (
              <div className={`message ${m.role}`} key={m.id}>
                <div className="avatar">
                  {m.role === "user" ? <UserRound size={16} /> : <Bot size={16} />}
                </div>

                <div className="message-body">
                  <div className="message-meta-header">
                    <small>{m.role === "user" ? "YOU" : "CYBERINTEL ASSISTANT"}</small>
                    {m.role === "assistant" && m.content && (
                      <button
                        type="button"
                        className="copy-msg-btn"
                        onClick={() => handleCopy(m.content, m.id)}
                        title="Copy message"
                      >
                        {copiedId === m.id ? (
                          <Check size={13} className="text-green-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    )}
                  </div>

                  {m.role === "assistant" && m.content ? (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p>{m.content || (busy && m.role === "assistant" ? "Thinking…" : "")}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}
      </div>

      <form className="chat-form" onSubmit={submit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask about a CVE, threat actor, attack technique..."
          rows={2}
          disabled={busy}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />

        <button
          className="send-button"
          disabled={busy || !prompt.trim()}
          aria-label="Send message"
        >
          {busy ? <LoaderCircle className="spin" size={19} /> : <ArrowUp size={20} />}
        </button>

        <div className="input-hint">Enter to send · Shift + Enter for a new line</div>
      </form>
    </section>
  );
}
