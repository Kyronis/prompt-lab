const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

export async function fetchPrompts() {
  const res = await fetch(`${API_BASE}/api/prompts`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Failed to fetch prompts: ${res.status}`);
  return res.json();
}

export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/api/projects`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
  return res.json();
}

export async function fetchModelProviders() {
  const res = await fetch(`${API_BASE}/api/model-providers`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Failed to fetch model providers: ${res.status}`);
  return res.json();
}

export async function fetchModels() {
  const res = await fetch(`${API_BASE}/api/models`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);
  return res.json();
}
