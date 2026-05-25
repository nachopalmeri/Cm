"use client";

import { useState, useEffect } from "react";

interface Draft {
  id: string;
  user_id: string;
  brain_id: string | null;
  title: string;
  content: string;
  channel: 'twitter' | 'linkedin' | 'substack' | 'tiktok' | 'general';
  format?: 'thread' | 'post' | 'newsletter' | 'script';
  status: 'draft' | 'pending' | 'approved' | 'published' | 'rejected' | 'archived';
  voice_match_score: number | null;
  violations: any[] | null;
  corrections_count: number;
  metadata: any;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface LearnedRule {
  rule: string;
  category: 'vocabulary' | 'structure' | 'tone' | 'format';
  confidence: number;
  examples?: {
    before: string;
    after: string;
  };
  created_at: string;
}


export default function BrainPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [rules, setRules] = useState<LearnedRule[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [editText, setEditText] = useState("");
  const [voiceMatch, setVoiceMatch] = useState(85);
  const [showToast, setShowToast] = useState(false);
  const [sampleTexts, setSampleTexts] = useState<string[]>([]);
  const [newSampleText, setNewSampleText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch brain data on mount
  useEffect(() => {
    fetchBrainData();
    fetchDrafts();
  }, []);

  const fetchBrainData = async () => {
    try {
      const res = await fetch('/api/brain');
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.brain) {
        setVoiceMatch(data.brain.voice_match_score || 85);
        setRules(data.brain.rules || []);
        setSampleTexts(data.brain.sample_texts || []);
      } else {
        throw new Error('No brain data received');
      }
    } catch (error) {
      console.error('Failed to fetch brain:', error);
      setError('No se pudo cargar tu Brand Brain. Recarga la página.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrafts = async () => {
    try {
      const res = await fetch('/api/drafts?limit=10');
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setDrafts(data.drafts || []);
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
      // No bloqueante - solo log
    }
  };

  const addSampleText = async () => {
    if (!newSampleText.trim()) return;
    
    setLoading(true);
    try {
      const updatedTexts = [...sampleTexts, newSampleText];
      const res = await fetch('/api/brain', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sample_texts: updatedTexts })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setSampleTexts(updatedTexts);
      setNewSampleText("");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (error) {
      console.error('Failed to add sample text:', error);
      setError('No se pudo guardar el texto. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (draft: Draft) => {
    setSelectedDraft(draft);
    setEditText(draft.content);
  };

  const saveCorrection = async () => {
    if (!selectedDraft) return;
    // This will be implemented when voice/learn API is ready
    const updated = drafts.map((d) => d.id === selectedDraft.id ? { ...d, content: editText, corrections_count: d.corrections_count + 1 } : d);
    setDrafts(updated);
    setSelectedDraft(null);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-slate-600">Loading...</div></div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Brand Brain</h1>

      {/* Error Toast */}
      {error && (
        <div className="fixed top-6 right-6 z-50 rounded-xl bg-red-50 border border-red-200 px-5 py-3 text-sm font-medium text-red-900 shadow-lg flex items-center gap-3">
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload Sample Text */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Upload Sample Text</h2>
        <p className="text-xs text-slate-500 mb-4">Add examples of your writing to train your brand voice</p>
        <textarea
          value={newSampleText}
          onChange={(e) => setNewSampleText(e.target.value)}
          placeholder="Paste your text here... (e.g., a tweet, blog post, or any content in your voice)"
          className="w-full min-h-32 resize-none rounded-lg border border-slate-200 p-4 text-sm leading-7 text-slate-900 outline-none focus:border-brand-500"
        />
        <button
          onClick={addSampleText}
          disabled={!newSampleText.trim()}
          className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          Add to Brain
        </button>
        {sampleTexts.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-slate-700">{sampleTexts.length} sample texts saved:</p>
            {sampleTexts.map((text, idx) => (
              <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                {text.slice(0, 100)}{text.length > 100 ? '...' : ''}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice Match */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" role="region" aria-label="Voice Match Score">
          <h2 className="text-sm font-semibold text-slate-900">Voice match</h2>
          <div className="mt-4">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-brand-600">{voiceMatch}%</span>
              <span className="mb-1 text-sm text-green-600">↑ +{voiceMatch - 85}%</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${voiceMatch}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">Mejorando con cada corrección</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Tono detectado</h2>
          <p className="mt-2 text-sm text-slate-600">Directo, opinionado, sin relleno. Cada post abre con una tesis y cierra con acción.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Reglas activas</h2>
          <p className="mt-2 text-3xl font-bold text-slate-900">{rules.length}</p>
          <p className="mt-1 text-xs text-slate-500">{drafts.reduce((a, b) => a + b.corrections_count, 0)} correcciones aplicadas</p>
        </div>
      </div>

      {/* Drafts */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Drafts generados</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {drafts.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-6 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{d.title}</p>
                <p className="text-xs text-slate-500">{d.channel} · {d.corrections_count} correcciones</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${d.status === "approved" ? "bg-green-50 text-green-700" : d.status === "pending" ? "bg-yellow-50 text-yellow-700" : "bg-slate-100 text-slate-600"}`}>
                  {d.status}
                </span>
                <button onClick={() => openEditor(d)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
                  Corregir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor modal */}
      {selectedDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">{selectedDraft.title}</h3>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="mt-4 min-h-48 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm leading-7 text-slate-900 outline-none focus:border-brand-500"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setSelectedDraft(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                Cancelar
              </button>
              <button 
                onClick={saveCorrection} 
                disabled={saving}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar corrección'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Training history */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Historial de aprendizaje</h2>
        <div className="mt-4 space-y-3">
          {rules.length === 0 ? (
            <p className="text-sm text-slate-500">No hay reglas aprendidas aún. Corrige drafts para que el sistema aprenda tu estilo.</p>
          ) : (
            rules.map((r, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                <span className="mt-0.5 text-brand-600">✓</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">{r.rule}</p>
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                      {r.category}
                    </span>
                  </div>
                  {r.examples && (
                    <div className="mt-2 text-xs text-slate-600">
                      <p>❌ Antes: "{r.examples.before}"</p>
                      <p className="mt-1">✅ Ahora: "{r.examples.after}"</p>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    Confianza: {r.confidence}% · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          Regla aprendida · Voice match subió a {voiceMatch}%
        </div>
      )}
    </div>
  );
}