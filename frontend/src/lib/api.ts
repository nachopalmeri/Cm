const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface BrandProfile {
  name: string;
  handle: string;
  voice: string;
  tone: string;
  personality: string;
  style: string;
  audience_description: string;
  platforms: string[];
}

export interface IngestRequest {
  texts: string[];
  source: string;
  brand_profile: BrandProfile;
}

export interface GenerateRequest {
  topic: string;
  platform: string;
  count: number;
  brand_profile: BrandProfile;
}

export interface FeedbackRequest {
  draft_id: string;
  draft_text: string;
  approved: boolean;
  correction?: string;
  brand_profile_id: string;
}

export interface ContentDraft {
  id: string;
  text: string;
  platform: string;
  topic: string;
  approved: boolean | null;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

export const api = {
  ingest: (data: IngestRequest) =>
    apiFetch("/ghostwriter/ingest", { method: "POST", body: JSON.stringify(data) }),

  profile: (brandId: string) =>
    apiFetch(`/ghostwriter/profile?brand_id=${brandId}`),

  generate: (data: GenerateRequest) =>
    apiFetch<{ options: ContentDraft[] }>("/ghostwriter/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  feedback: (data: FeedbackRequest) =>
    apiFetch("/ghostwriter/feedback", { method: "POST", body: JSON.stringify(data) }),
};
