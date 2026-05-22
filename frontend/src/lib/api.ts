const API_URL = "http://localhost:8000";

export interface BrandProfile {
  name: string; voice: string; tone: string; style: string;
}

export interface ContentDraft {
  id: string; body: string; platform: string; topic: string;
}

export interface GenerateResponse {
  options: ContentDraft[];
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const url = API_URL + path;
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) throw new Error("API: " + res.status);
  return res.json();
}

export async function ingestVoice(data: { brand_id: string; content: string; source: string }) {
  return apiFetch("/ghostwriter/ingest", { method: "POST", body: JSON.stringify(data) });
}

export async function generateDraft(data: { brand_profile: BrandProfile; topic: string; platform: string; count: number }) {
  return apiFetch<GenerateResponse>("/ghostwriter/generate", { method: "POST", body: JSON.stringify(data) });
}

export async function submitFeedback(data: { brand_id: string; draft_id: string; approved: boolean; corrections?: string }) {
  return apiFetch("/ghostwriter/feedback", { method: "POST", body: JSON.stringify(data) });
}
