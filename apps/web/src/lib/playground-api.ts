const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const TOKEN_KEY = 'prompt-lab-token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401) {
    clearAuthToken();
  }
  return res;
}

export interface ModelWithProvider {
  id: string;
  name: string;
  modelId: string;
  maxTokens: number | null;
  provider: { id: string; name: string };
}

export interface ExecutionResult {
  id: string;
  promptContent: string;
  userInput: string | null;
  modelId: string;
  temperature: number;
  maxTokens: number | null;
  result: string | null;
  error: string | null;
  durationMs: number | null;
  createdAt: string;
  model?: ModelWithProvider;
}

export async function fetchModelsClient(): Promise<ModelWithProvider[]> {
  const res = await authFetch('/api/models');
  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);
  return res.json();
}

export interface ExecuteParams {
  promptContent: string;
  userInput?: string;
  modelId: string;
  temperature?: number;
  maxTokens?: number;
  promptId?: string;
}

export async function executePrompt(params: ExecuteParams): Promise<ExecutionResult> {
  const res = await authFetch('/api/executions', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Execution failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchExecutionHistory(promptId?: string): Promise<ExecutionResult[]> {
  const path = promptId
    ? `/api/executions/by-prompt/${encodeURIComponent(promptId)}`
    : '/api/executions';
  const res = await authFetch(path);
  if (!res.ok) throw new Error(`Failed to fetch executions: ${res.status}`);
  return res.json();
}

export interface OptimizeParams {
  promptContent: string;
  context?: string;
  modelId: string;
}

export interface OptimizeResult {
  original: string;
  optimized: string;
  suggestions: string[];
}

export async function optimizePrompt(params: OptimizeParams): Promise<OptimizeResult> {
  const res = await authFetch('/api/optimizations', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Optimization failed: ${res.status}`);
  }
  return res.json();
}

export interface LoginResult {
  token: string;
  user: { id: string; email: string; name: string };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Login failed: ${res.status}`);
  }
  const data: LoginResult = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function register(email: string, password: string, name: string): Promise<LoginResult> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Registration failed: ${res.status}`);
  }
  const data: LoginResult = await res.json();
  setAuthToken(data.token);
  return data;
}
