"use client";



import { useState } from "react";

interface Draft {
  id: number;
  title: string;
  content: string;
  status: "draft" | "pending" | "approved";
  channel: string;
  corrections: number;
}

interface LearnedRule {
  id: number;
  rule: string;
  source: string;
  date: string;
}

const initialDrafts: Draft[] = [
  { id: 1, title: "Thread: Por qué los agentes sin memoria son autocomplete con traje", content: "Los agentes de IA sin memoria persistente son básicamente autocomplete con una interfaz bonita. No recuerdan quién sos, no aprenden de correcciones, y cada sesión empieza desde cero. Eso no es inteligencia, es magia barata.", status: "approved", channel: "X", corrections: 2 },
  { id: 2, title: "Newsletter: La infraestructura de marca en 2025", content: "La marca ya no se construye con posts aislados. Se construye con sistemas que memorizan tu voz, protegen tu tono y ejecutan distribución multicanal mientras vos dormís.", status: "pending", channel: "Substack", corrections: 1 },
  { id: 3, title: "LinkedIn: Cómo escalar voz sin perder autenticidad", content: "El mayor miedo de los founders al usar IA para contenido: perder la voz personal. La solución no es escribir menos con IA. Es construir un Brand Brain que entienda TU voz.", status: "draft", channel: "LinkedIn", corrections: 0 },
];

const initialRules: LearnedRule[] = [
  { id: 1, rule: "Evitar buzzwords y frases genéricas de IA", source: "Corrección en draft #1", date: "2 días" },
  { id: 2, rule: "Abrir con una tesis fuerte, nunca con contexto", source: "Corrección en draft #1", date: "2 días" },
  { id: 3, rule: "Usar frases cortas. Máximo 20 palabras por oración.", source: "Corrección en draft #2", date: "1 día" },
  { id: 4, rule: "Priorizar velocidad y claridad sobre sofisticación", source: "Brain Builder inicial", date: "3 días" },
];

export default function BrainPage() {
  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts);
  const [rules, setRules] = useState<LearnedRule[]>(initialRules);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [editText, setEditText] = useState("");
  const [voiceMatch, setVoiceMatch] = useState(94);
  const [showToast, setShowToast] = useState(false);

  const openEditor = (draft: Draft) => {
    setSelectedDraft(draft);
    setEditText(draft.content);
  };

  const saveCorrection = () => {
    if (!selectedDraft) return;
    const updated = drafts.map((d) => d.id === selectedDraft.id ? { ...d, content: editText, corrections: d.corrections + 1 } : d);
    setDrafts(updated);

    const newRule: LearnedRule = {
      id: rules.length + 1,
      rule: `Regla aprendida de corrección en "${selectedDraft.title.slice(0, 30)}..."`,
      source: `Corrección en draft #${selectedDraft.id}`,
      date: "Ahora",
    };
    setRules([newRule, ...rules]);
    setVoiceMatch((prev) => Math.min(prev + 1, 99));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
    setSelectedDraft(null);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Brand Brain</h1>

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
          <p className="mt-1 text-xs text-slate-500">{drafts.reduce((a, b) => a + b.corrections, 0)} correcciones aplicadas</p>
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
                <p className="text-xs text-slate-500">{d.channel} · {d.corrections} correcciones</p>
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
              <button onClick={saveCorrection} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
                Guardar corrección
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Training history */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Historial de aprendizaje</h2>
        <div className="mt-4 space-y-3">
          {rules.map((r) => (
            <div key={r.id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              <span className="mt-0.5 text-brand-600">✓</span>
              <div>
                <p className="text-sm font-medium text-slate-900">{r.rule}</p>
                <p className="text-xs text-slate-500">{r.source} · {r.date}</p>
              </div>
            </div>
          ))}
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