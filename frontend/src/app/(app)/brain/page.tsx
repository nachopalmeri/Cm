"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Rule {
  rule: string;
  category: string;
  confidence: number;
  examples?: { before: string; after: string };
  created_at: string;
}

interface Brain {
  id: string;
  name: string;
  tone: string;
  voice_match_score: number;
  corrections_count: number;
  sample_texts: string[];
  rules: Rule[];
}

export default function BrainPage() {
  const [brain, setBrain] = useState<Brain | null>(null);
  const [loading, setLoading] = useState(true);
  const [newSample, setNewSample] = useState('');
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { fetchBrain(); }, []);

  const fetchBrain = async () => {
    try {
      const res = await fetch('/api/brain');
      const data = await res.json();
      if (data.brain) setBrain(data.brain);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addSample = async () => {
    if (!newSample.trim() || !brain) return;
    setAdding(true);
    try {
      const updated = [...(brain.sample_texts || []), newSample.trim()];
      await fetch('/api/brain', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sample_texts: updated })
      });
      setBrain({ ...brain, sample_texts: updated });
      setNewSample('');
      showToast('Sample agregado');
    } catch (e) { showToast('Error al agregar'); }
    finally { setAdding(false); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-white/40 text-sm">Loading...</div></div>;
  if (!brain) return <div className="text-center py-20"><p className="text-white/40">No se encontro tu Brand Brain</p><Link href="/onboarding" className="mt-4 inline-block text-purple-400 hover:text-purple-300">Crear uno</Link></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Brand Brain</h1>
        <Link href="/content" className="rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
          Corregir Drafts
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <h2 className="text-xs font-medium text-white/40">Voice match</h2>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-bold text-white">{brain.voice_match_score}%</span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all" style={{ width: brain.voice_match_score + '%' }} />
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <h2 className="text-xs font-medium text-white/40">Tono detectado</h2>
          <p className="mt-3 text-sm text-white/70">{brain.tone || 'Aun no definido'}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <h2 className="text-xs font-medium text-white/40">Reglas activas</h2>
          <p className="mt-3 text-3xl font-bold text-white">{brain.rules?.length || 0}</p>
          <p className="mt-1 text-xs text-white/30">{brain.corrections_count} correcciones aplicadas</p>
        </div>
      </div>

      {/* Add Sample */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-white/70">Agregar Sample</h2>
        <textarea
          value={newSample}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewSample(e.target.value)}
          className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50 resize-none"
          rows={3}
          placeholder="Pega un texto que represente tu voz..."
        />
        <button
          onClick={addSample}
          disabled={!newSample.trim() || adding}
          className="mt-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-30"
        >
          {adding ? 'Agregando...' : 'Agregar al Brain'}
        </button>
      </div>

      {/* Sample Texts */}
      {brain.sample_texts && brain.sample_texts.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-white/70">Samples guardados ({brain.sample_texts.length})</h2>
          <div className="mt-4 space-y-2">
            {brain.sample_texts.map((text, idx) => (
              <div key={idx} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs text-white/50">
                {text.slice(0, 200)}{text.length > 200 ? '...' : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-white/70">Reglas aprendidas</h2>
        <div className="mt-4 space-y-3">
          {!brain.rules || brain.rules.length === 0 ? (
            <p className="text-sm text-white/30">No hay reglas aun. Corrige drafts para que el sistema aprenda tu estilo.</p>
          ) : (
            brain.rules.map((r, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                <span className="mt-0.5 text-purple-400">&#10003;</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{r.rule}</p>
                    <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400">
                      {r.category}
                    </span>
                  </div>
                  {r.examples && (
                    <div className="mt-2 text-xs text-white/40">
                      <p>Antes: &quot;{r.examples.before}&quot;</p>
                      <p className="mt-1">Ahora: &quot;{r.examples.after}&quot;</p>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-white/25">Confianza: {r.confidence}%</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-lg border border-white/10 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}