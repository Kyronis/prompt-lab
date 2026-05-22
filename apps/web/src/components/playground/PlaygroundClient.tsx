'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Wand2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  Copy,
  LogIn,
  LogOut,
  History,
} from 'lucide-react';
import {
  getAuthToken,
  clearAuthToken,
  fetchModelsClient,
  executePrompt,
  fetchExecutionHistory,
  optimizePrompt,
  login,
  register,
  type ModelWithProvider,
  type ExecutionResult,
} from '@/lib/playground-api';

// ---------------------------------------------------------------------------
// Auth Section
// ---------------------------------------------------------------------------

function AuthSection({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        if (mode === 'login') {
          await login(email, password);
        } else {
          await register(email, password, name);
        }
        onAuth();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setLoading(false);
      }
    },
    [mode, email, password, name, onAuth],
  );

  return (
    <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">
        {mode === 'login' ? 'Sign In' : 'Create Account'}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Authentication is required to execute prompts.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === 'register' && (
          <div>
            <label htmlFor="auth-name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="auth-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        )}
        <div>
          <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="auth-password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError(null);
          }}
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          {mode === 'login' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Playground
// ---------------------------------------------------------------------------

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant.';

export function PlaygroundClient() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [models, setModels] = useState<ModelWithProvider[]>([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [userInput, setUserInput] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [executing, setExecuting] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ExecutionResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Check auth on mount
  useEffect(() => {
    setIsAuthed(!!getAuthToken());
  }, []);

  // Load models when authenticated
  useEffect(() => {
    if (!isAuthed) return;
    let cancelled = false;
    fetchModelsClient()
      .then((data) => {
        if (cancelled) return;
        setModels(data);
        if (data.length > 0 && !selectedModelId) {
          setSelectedModelId(data[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load models. Is the backend running?');
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthed, selectedModelId]);

  // Load execution history
  const loadHistory = useCallback(() => {
    if (!isAuthed) return;
    fetchExecutionHistory()
      .then(setHistory)
      .catch(() => {
        /* ignore history load errors */
      });
  }, [isAuthed]);

  useEffect(() => {
    if (isAuthed) loadHistory();
  }, [isAuthed, loadHistory]);

  const handleExecute = useCallback(async () => {
    if (!selectedModelId || !systemPrompt.trim()) return;
    setError(null);
    setExecuting(true);
    try {
      const exec = await executePrompt({
        promptContent: systemPrompt,
        userInput: userInput.trim() || undefined,
        modelId: selectedModelId,
        temperature,
        maxTokens,
      });
      setResult(exec);
      loadHistory();
      // Scroll to result
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setExecuting(false);
    }
  }, [selectedModelId, systemPrompt, userInput, temperature, maxTokens, loadHistory]);

  const handleOptimize = useCallback(async () => {
    if (!selectedModelId || !systemPrompt.trim()) return;
    setError(null);
    setOptimizing(true);
    setSuggestions([]);
    try {
      const result = await optimizePrompt({
        promptContent: systemPrompt,
        modelId: selectedModelId,
      });
      setSystemPrompt(result.optimized);
      setSuggestions(result.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setOptimizing(false);
    }
  }, [selectedModelId, systemPrompt]);

  const handleCopyResult = useCallback(() => {
    if (result?.result) {
      navigator.clipboard.writeText(result.result).catch(() => {});
    }
  }, [result]);

  const handleLogout = useCallback(() => {
    clearAuthToken();
    setIsAuthed(false);
    setResult(null);
    setHistory([]);
  }, []);

  const selectedModel = useMemo(
    () => models.find((m) => m.id === selectedModelId),
    [models, selectedModelId],
  );

  if (!isAuthed) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Playground</h1>
        </div>
        <AuthSection onAuth={() => setIsAuthed(true)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Playground</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) loadHistory();
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              showHistory
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <History className="h-4 w-4" />
            History
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Input */}
        <div className="space-y-4">
          {/* Model selector */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <label htmlFor="model-select" className="block text-sm font-medium text-gray-700">
              Model
            </label>
            <select
              id="model-select"
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              {models.length === 0 && <option value="">No models available</option>}
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider.name})
                </option>
              ))}
            </select>

            {/* Parameters */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                  Temperature: {temperature.toFixed(1)}
                </label>
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="mt-1 w-full accent-primary-600"
                />
              </div>
              <div>
                <label htmlFor="max-tokens" className="block text-sm font-medium text-gray-700">
                  Max Tokens
                </label>
                <input
                  id="max-tokens"
                  type="number"
                  min={1}
                  max={selectedModel?.maxTokens ?? 128000}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <label htmlFor="system-prompt" className="text-sm font-medium text-gray-700">
                System Prompt
              </label>
              <button
                type="button"
                onClick={handleOptimize}
                disabled={optimizing || !systemPrompt.trim() || !selectedModelId}
                className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
                title="Use AI to optimize this prompt"
              >
                {optimizing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                Optimize
              </button>
            </div>
            <textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={8}
              placeholder="Enter your system prompt..."
              className="mt-2 block w-full resize-y rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />

            {/* Optimization suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-3 rounded-lg bg-amber-50 p-3">
                <h4 className="text-xs font-medium text-amber-800">Optimization Suggestions</h4>
                <ul className="mt-1.5 space-y-1">
                  {suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-amber-700">
                      <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* User Input */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <label htmlFor="user-input" className="block text-sm font-medium text-gray-700">
              User Input (optional)
            </label>
            <textarea
              id="user-input"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={4}
              placeholder="Enter a test message to send to the model..."
              className="mt-2 block w-full resize-y rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Execute button */}
          <button
            type="button"
            onClick={handleExecute}
            disabled={executing || !selectedModelId || !systemPrompt.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {executing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {executing ? 'Executing...' : 'Execute'}
          </button>
        </div>

        {/* Right: Output */}
        <div className="space-y-4">
          <div ref={resultRef} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Output</h3>
              {result?.result && (
                <button
                  type="button"
                  onClick={handleCopyResult}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
              )}
            </div>

            {!result && !executing && (
              <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-16 text-center">
                <Play className="h-8 w-8 text-gray-300" />
                <p className="mt-3 text-sm text-gray-400">
                  Execute a prompt to see the output here.
                </p>
              </div>
            )}

            {executing && (
              <div className="mt-4 flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <p className="mt-3 text-sm text-gray-500">Waiting for model response...</p>
              </div>
            )}

            {result && !executing && (
              <div className="mt-3 space-y-3">
                {result.error ? (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{result.error}</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <pre className="whitespace-pre-wrap break-words font-mono text-sm">
                        {result.result}
                      </pre>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {result.durationMs != null && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {result.durationMs}ms
                    </span>
                  )}
                  {result.model && (
                    <span>
                      {result.model.name} ({result.model.provider.name})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Execution History (inline) */}
          {showHistory && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700">Recent Executions</h3>
              {history.length === 0 ? (
                <p className="mt-3 text-sm text-gray-400">No executions yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {history.slice(0, 20).map((exec) => (
                    <button
                      key={exec.id}
                      type="button"
                      onClick={() => setResult(exec)}
                      className="block w-full rounded-lg border border-gray-100 p-3 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate text-sm font-medium text-gray-700">
                          {exec.promptContent.slice(0, 60)}
                          {exec.promptContent.length > 60 ? '...' : ''}
                        </span>
                        <span className="ml-2 shrink-0 text-xs text-gray-400">
                          {new Date(exec.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                        {exec.error ? (
                          <span className="text-red-500">Error</span>
                        ) : (
                          <span className="text-green-600">Success</span>
                        )}
                        {exec.durationMs != null && <span>{exec.durationMs}ms</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
