export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: string;
};

export type ScreeningResult = {
  verdict?: string;
  risk_score?: number;
  confidence?: number;
  threat_category?: string;
  prompt_injection_detected?: boolean;
  mitre_techniques?: string[];
  summary?: string;
  findings?: string[];
  recommended_action?: string;
  iocs?: Record<string, string[]>;
  sources?: { citation: string; source: string; id: string; title: string; url?: string | null }[];
  filename?: string;
};

export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  auth_provider?: string;
  avatar_url?: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
  message: string;
};

export type AgentToolMeta = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type AgentToolsResponse = {
  count: number;
  tools: AgentToolMeta[];
};

export type AgentHealthResponse = {
  status: "ok" | "degraded";
  providers: Record<string, "available" | "not_configured">;
  tools_registered: number;
  tool_names: string[];
};

export type AgentAnalyzeResult = {
  session_id: string;
  query: string;
  intent: string;
  answer: string;
  tools_used: string[];
  tool_details: Record<string, unknown>[];
  sources: { title?: string; source?: string; url?: string; citation?: string }[];
  iterations: number;
  execution_time_ms: number;
};

export type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  pinned?: boolean;
};

export type PluginIntegration = {
  provider: "github" | "gmail" | "google_drive" | "slack";
  name: string;
  description: string;
  icon: string;
  is_connected: boolean;
  account_info: Record<string, any>;
  scopes: string[];
  available_tools: string[];
};

export type ToolExecutionResponse = {
  success: boolean;
  tool_name: string;
  result?: any;
  requires_confirmation?: boolean;
  confirmation_prompt?: string;
  error?: string;
};