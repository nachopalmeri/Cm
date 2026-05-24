"use client";



import { useState } from "react";

interface Agent {
  name: string;
  status: "active" | "paused";
  desc: string;
  lastAction: string;
  output: string;
}

const initialAgents: Agent[] = [
  { name: "Research", status: "active", desc: "Detecta señales del mercado y ángulos antes de escribir.", lastAction: "Detectó 3 tendencias emergentes en AI", output: "3 ideas de ángulo listas" },
  { name: "Voice", status: "active", desc: "Convierte contexto en contenido con tu tono y vocabulario.", lastAction: "Generó draft para LinkedIn · 94% match", output: "1 draft listo para revisión" },
  { name: "Editor", status: "active", desc: "Audita drafts contra tu Brand Brain y elimina AI slop.", lastAction: "Auditó 2 drafts · 0 slop detectado", output: "2 drafts aprobados" },
  { name: "Distributor", status: "paused", desc: "Adapta contenido a X, LinkedIn, newsletter y TikTok scripts.", lastAction: "Adaptó 1 thread a 4 formatos", output: "4 piezas listas" },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);

  const toggle = (idx: number) => {
    setAgents((prev) => prev.map((a, i) => i === idx ? { ...a, status: a.status === "active" ? "paused" : "active" } : a));
  };

  const pipeline = [
    { from: "Research", to: "Voice", label: "Ideas → Draft" },
    { from: "Voice", to: "Editor", label: "Draft → Audit" },
    { from: "Editor", to: "Distributor", label: "Aprobado → Distribución" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Agents</h1>

      {/* Pipeline visual */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Pipeline de ejecución</h2>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {agents.map((a, i) => (
            <div key={a.name} className="flex items-center gap-2">
              <div className={`rounded-xl border px-4 py-3 text-center min-w-[120px] ${a.status === "active" ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-slate-50 opacity-60"}`}>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{a.name}</p>
                <p className="mt-1 text-xs text-slate-600">{a.output}</p>
              </div>
              {i < agents.length - 1 && (
                <div className="flex flex-col items-center px-1">
                  <span className="text-[10px] text-slate-400">{pipeline[i]?.label}</span>
                  <span className="text-lg text-slate-300">→</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Agent cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {agents.map((a, i) => (
          <div key={a.name} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{a.name} Agent</h2>
              <button
                onClick={() => toggle(i)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${a.status === "active" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}
              >
                {a.status === "active" ? "ON" : "OFF"}
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-600">{a.desc}</p>
            <div className="mt-4 rounded-lg bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Última acción</p>
              <p className="mt-1 text-sm text-slate-700">{a.lastAction}</p>
            </div>
            <button className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Configurar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}