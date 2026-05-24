"use client";



import { useState, useEffect } from "react";

interface Event {
  id: number;
  agent: string;
  message: string;
  timestamp: string;
}

export default function OrchestrationPage() {
  const [isPaused, setIsPaused] = useState(false);
  const [events, setEvents] = useState<Event[]>([
    { id: 1, agent: "Research", message: "Detectó 3 tendencias en AI agents", timestamp: "10:32 AM" },
    { id: 2, agent: "Voice", message: "Generando draft para LinkedIn...", timestamp: "10:33 AM" },
  ]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      const newEvent: Event = {
        id: events.length + 1,
        agent: ["Research", "Voice", "Editor", "Distributor"][Math.floor(Math.random() * 4)],
        message: [
          "Analizando tendencias del mercado...",
          "Draft generado · Voice match 94%",
          "Auditando contra 12 reglas...",
          "Programado para publicar en 2h",
          "Sin AI slop detectado — aprobado",
          "Adaptando a 4 formatos...",
        ][Math.floor(Math.random() * 6)],
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 10));
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused, events.length]);

  const pipeline = [
    { name: "Research", status: "active", output: "3 ideas de ángulo" },
    { name: "Voice", status: "working", output: "Draft en progreso..." },
    { name: "Editor", status: "idle", output: "Esperando draft" },
    { name: "Distributor", status: "idle", output: "Esperando aprobación" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Orchestration Dashboard</h1>
        <div className="flex gap-3">
          <button onClick={() => setIsPaused(!isPaused)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${isPaused ? "bg-green-600 text-white hover:bg-green-700" : "bg-yellow-600 text-white hover:bg-yellow-700"}`}>
            {isPaused ? "Resume" : "Pause"} Pipeline
          </button>
          <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            Skip to Approval
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Pipeline Visual</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {pipeline.map((agent, i) => (
            <div key={agent.name}>
              <div className={`rounded-xl border p-5 ${agent.status === "active" ? "border-green-200 bg-green-50" : agent.status === "working" ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">{agent.name}</h3>
                  <span className={`h-2 w-2 rounded-full ${agent.status === "active" ? "bg-green-500 animate-pulse" : agent.status === "working" ? "bg-brand-500 animate-pulse" : "bg-slate-300"}`} />
                </div>
                <p className="mt-3 text-xs text-slate-600">{agent.output}</p>
              </div>
              {i < pipeline.length - 1 && (
                <div className="mx-auto mt-2 flex h-8 w-8 items-center justify-center text-slate-300">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Live Feed</h2>
          <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-brand-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{event.agent} Agent</p>
                  <p className="text-xs text-slate-600">{event.message}</p>
                </div>
                <span className="text-xs text-slate-400">{event.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Performance Metrics</h2>
          <div className="mt-6 space-y-6">
            <div>
              <p className="text-sm text-slate-600">Tiempo promedio de pipeline</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">4 min 32s</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Success rate</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-3 flex-1 rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-green-500" style={{ width: "92%" }} />
                </div>
                <span className="text-2xl font-bold text-green-600">92%</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">de drafts aprobados</p>
            </div>
            <div className="rounded-lg bg-brand-50 p-4">
              <p className="text-sm font-semibold text-brand-900">Pipeline activo</p>
              <p className="mt-1 text-xs text-brand-600">3 drafts en progreso · 2 en cola</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}