"use client";



import { useState } from "react";

export default function EditorPage() {
  const [blockSlop, setBlockSlop] = useState(true);
  const [enforceTone, setEnforceTone] = useState(true);
  const [strictness, setStrictness] = useState(7);
  const [blockedPhrases, setBlockedPhrases] = useState(["disrupción", "innovador", "revolucionario", "game-changer"]);
  const [newPhrase, setNewPhrase] = useState("");

  const addPhrase = () => {
    if (newPhrase.trim()) {
      setBlockedPhrases([...blockedPhrases, newPhrase.trim()]);
      setNewPhrase("");
    }
  };

  const removePhrase = (idx: number) => {
    setBlockedPhrases(blockedPhrases.filter((_, i) => i !== idx));
  };

  const auditLog = [
    { id: 1, draft: "Thread sobre AI agents", reason: "Detectado 'revolucionario' (frase bloqueada)", status: "blocked" },
    { id: 2, draft: "Newsletter: Brand Brain", reason: "Tone match 98% - aprobado", status: "approved" },
    { id: 3, draft: "LinkedIn: Scaling voice", reason: "Tone match 96% - aprobado", status: "approved" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Editor Agent Configuration</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Audit Rules</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Block AI slop</p>
              <p className="text-xs text-slate-500">Detecta frases genéricas de IA</p>
            </div>
            <button onClick={() => setBlockSlop(!blockSlop)} className={`relative h-6 w-11 rounded-full transition ${blockSlop ? "bg-brand-600" : "bg-slate-200"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${blockSlop ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Enforce tone consistency</p>
              <p className="text-xs text-slate-500">Compara contra Brand Brain</p>
            </div>
            <button onClick={() => setEnforceTone(!enforceTone)} className={`relative h-6 w-11 rounded-full transition ${enforceTone ? "bg-brand-600" : "bg-slate-200"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${enforceTone ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Strictness level: {strictness}/10</label>
            <input type="range" min="1" max="10" value={strictness} onChange={(e) => setStrictness(parseInt(e.target.value))} className="mt-2 w-full" />
            <p className="mt-1 text-xs text-slate-500">{strictness < 4 ? "Permisivo" : strictness < 7 ? "Balanceado" : "Estricto"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Blocked Phrases</h2>
        <div className="mt-4 flex gap-3">
          <input
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPhrase()}
            placeholder="Agregar palabra o frase prohibida"
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500"
          />
          <button onClick={addPhrase} className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
            Add
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {blockedPhrases.map((phrase, i) => (
            <div key={i} className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5">
              <span className="text-sm text-red-700">{phrase}</span>
              <button onClick={() => removePhrase(i)} className="text-red-600 hover:text-red-700">×</button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Audit Log</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">12</p>
            <p className="text-xs text-slate-500">Drafts auditados</p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <p className="text-2xl font-bold text-red-700">2</p>
            <p className="text-xs text-red-600">Bloqueados</p>
          </div>
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">10</p>
            <p className="text-xs text-green-600">Aprobados</p>
          </div>
        </div>
        <div className="mt-6 space-y-2">
          {auditLog.map((log) => (
            <div key={log.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{log.draft}</p>
                <p className="text-xs text-slate-500">{log.reason}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${log.status === "approved" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {log.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}