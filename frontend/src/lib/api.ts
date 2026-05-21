const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface BrandProfile {
  name: string; handle: string; voice: string; tone: string;
  personality: string; style: string; audience_description: string; platforms: string[];
}
export interface ContentDraft { id: string; text: string; platform: string; topic: string; approved: boolean | null; }
export interface GenerateResponse { options: ContentDraft[]; }

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(${API_URL}, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) throw new Error(API : );
  return res.json();
}

export const api = {
  ingest: (texts: string[], source: string, brand: BrandProfile) =>
    apiFetch("/ghostwriter/ingest", { method: "POST", body: JSON.stringify({ texts, source, brand_profile: brand }) }),
  generate: (topic: string, platform: string, count: number, brand: BrandProfile) =>
    apiFetch<GenerateResponse>("/ghostwriter/generate", { method: "POST", body: JSON.stringify({ topic, platform, count, brand_profile: brand }) }),
  feedback: (draft_id: string, draft_text: string, approved: boolean, correction: string | undefined, brand_profile_id: string) =>
    apiFetch("/ghostwriter/feedback", { method: "POST", body: JSON.stringify({ draft_id, draft_text, approved, correction, brand_profile_id }) }),
};