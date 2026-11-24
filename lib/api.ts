
import type {
  ScreeningResult,
  AuthUser,
  AuthResponse,
  AgentHealthResponse,
  AgentToolsResponse,
  AgentAnalyzeResult,
  ChatMessage,
  PluginIntegration,
  ToolExecutionResponse,
} from "@/lib/types";

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");

export function apiUrl(path: string) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

const TOKEN_KEY = "cyber_intel_auth_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function checkBackend(): Promise<boolean> {
  try {
    const response = await fetch(apiUrl("/openapi.json"), {
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function loginApi(
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<AuthResponse> {
  const response = await fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, remember_me: rememberMe }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `Login failed (${response.status})`);
  }

  if (data.token) {
    setStoredToken(data.token);
  }
  return data as AuthResponse;
}

export async function loginWithGoogleApi(
  idToken: string,
  rememberMe: boolean = true
): Promise<AuthResponse> {
  const response = await fetch(apiUrl("/api/auth/google"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id_token: idToken, remember_me: rememberMe }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `Google authentication failed (${response.status})`);
  }

  if (data.token) {
    setStoredToken(data.token);
  }
  return data as AuthResponse;
}

export async function registerApi(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResponse> {
  const response = await fetch(apiUrl("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, full_name: fullName }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `Registration failed (${response.status})`);
  }

  if (data.token) {
    setStoredToken(data.token);
  }
  return data as AuthResponse;
}

export async function getMeApi(): Promise<AuthUser> {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(apiUrl("/api/auth/me"), {
    method: "GET",
    headers,
    credentials: "include",
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Unauthorized");
  }
  return data as AuthUser;
}

export async function logoutApi(): Promise<void> {
  try {
    await fetch(apiUrl("/api/auth/logout"), {
      method: "POST",
      credentials: "include",
    });
  } finally {
    removeStoredToken();
  }
}

export async function sendChat(
  prompt: string,
  sessionId: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(apiUrl("/api/chat"), {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    }),
    credentials: "include",
    body: JSON.stringify({
      prompt,
      session_id: sessionId,
    }),
    signal,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Chat API ${response.status}: ${detail || response.statusText}`
    );
  }

  if (!response.body) {
    throw new Error("The browser did not receive a response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let fullText = "";

  // Parse both normal JSON and escaped JSON payloads.
  const parsePayload = (raw: string) => {
    let data = raw.trim();

    // Remove literal escaped SSE separators at the end.
    data = data.replace(/\\r?\\n\\r?\\n$/, "");

    try {
      let parsed = JSON.parse(data);

      // Handle JSON encoded as a JSON string.
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }

      return parsed;
    } catch {
      // Handle escaped JSON such as {\"type\":\"done\"}.
      const normalized = data.replace(/\\"/g, '"');

      try {
        return JSON.parse(normalized);
      } catch {
        console.warn("Could not parse SSE payload:", raw);
        return null;
      }
    }
  };

  const processEvent = (event: string) => {
    const data = event
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");

    if (!data) return;

    const parsed = parsePayload(data);

    if (!parsed || typeof parsed !== "object") return;

    if (parsed.type === "chunk" && typeof parsed.text === "string") {
      fullText += parsed.text;
      onChunk(parsed.text);
    }

    if (parsed.type === "error") {
      throw new Error(parsed.detail || "Chat request failed.");
    }

    if (parsed.type === "sources") {
      console.log("Retrieved sources:", parsed.sources || []);
      console.log("Retrieved count:", parsed.retrieved_count ?? 0);
    }

    if (parsed.type === "done") {
      console.log("Chat stream completed:", parsed.provider || "Unknown provider");
    }
  };

  const processBuffer = (final = false) => {
    // Convert escaped separators between SSE events into real separators.
    buffer = buffer.replace(/\\n\\n(?=\s*data:)/g, "\n\n");

    const events = buffer.split(/\r?\n\r?\n/);

    // Keep the incomplete event until more data arrives.
    buffer = final ? "" : events.pop() || "";

    for (const event of events) {
      if (event.trim()) processEvent(event);
    }

    if (final && buffer.trim()) {
      processEvent(buffer);
    }
  };

  while (true) {
    const { value, done } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    processBuffer();
  }

  buffer += decoder.decode();

  // Process the final event, including a final escaped separator.
  buffer = buffer.replace(/\\r?\\n\\r?\\n/g, "\n\n");
  processBuffer(true);

  if (!fullText) {
    console.warn("Chat stream finished without any text chunks.");
  }

  return fullText;
}

export async function screenEvidence(input: {
  content?: string;
  file?: File;
  context?: string;
}): Promise<ScreeningResult> {
  const form = new FormData();

  if (input.content) form.append("content", input.content);
  if (input.file) form.append("file", input.file);
  if (input.context) form.append("context", input.context);

  const response = await fetch(apiUrl("/api/screening"), {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: form,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || `Screening API ${response.status}`);
  }

  return data as ScreeningResult;
}

export async function getAgentHealth(): Promise<AgentHealthResponse> {
  const response = await fetch(apiUrl("/api/agent/health"), {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Agent health check failed (${response.status})`);
  }
  return response.json();
}

export async function getAgentTools(): Promise<AgentToolsResponse> {
  const response = await fetch(apiUrl("/api/agent/tools"), {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch agent tools (${response.status})`);
  }
  return response.json();
}

export async function analyzeWithAgent(
  query: string,
  sessionId: string = "default-session"
): Promise<AgentAnalyzeResult> {
  const response = await fetch(apiUrl("/api/agent/analyze"), {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({ query, session_id: sessionId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `Agent analysis failed (${response.status})`);
  }
  return data as AgentAnalyzeResult;
}

export async function getChatSessionsApi(): Promise<{
  sessions: {
    id: string;
    title: string;
    created_at: string | null;
    updated_at: string | null;
    message_count: number;
  }[];
}> {
  const response = await fetch(apiUrl("/api/chat/sessions"), {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to load sessions (${response.status})`);
  }
  return response.json();
}

export async function getSessionMessagesApi(
  sessionId: string
): Promise<{ session_id: string; messages: ChatMessage[] }> {
  const response = await fetch(apiUrl(`/api/chat/sessions/${encodeURIComponent(sessionId)}`), {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to load conversation (${response.status})`);
  }
  return response.json();
}

export async function deleteSessionApi(sessionId: string): Promise<void> {
  const response = await fetch(apiUrl(`/api/chat/sessions/${encodeURIComponent(sessionId)}`), {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to delete session (${response.status})`);
  }
}

// ---------------------------------------------------------------------------
// Centralized OAuth Plugin Integrations (GitHub, Gmail, Google Drive, Slack)
// ---------------------------------------------------------------------------

export async function getIntegrationsApi(): Promise<PluginIntegration[]> {
  const response = await fetch(apiUrl("/api/v1/integrations"), {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch integrations (${response.status})`);
  }
  return response.json();
}

export async function connectIntegrationApi(provider: string): Promise<{ authorization_url: string; state: string }> {
  const response = await fetch(apiUrl(`/api/v1/integrations/${provider}/connect`), {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `Connect failed for ${provider}`);
  }
  return response.json();
}

export async function disconnectIntegrationApi(provider: string): Promise<void> {
  const response = await fetch(apiUrl(`/api/v1/integrations/${provider}/disconnect`), {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Disconnect failed for ${provider}`);
  }
}

export async function executePluginToolApi(
  provider: string,
  toolName: string,
  argumentsPayload: Record<string, any>,
  confirmed: boolean = false
): Promise<ToolExecutionResponse> {
  const response = await fetch(apiUrl(`/api/v1/integrations/${provider}/execute`), {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      tool_name: toolName,
      arguments: argumentsPayload,
      confirmed,
    }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `Tool execution failed for ${toolName}`);
  }
  return response.json();
}
