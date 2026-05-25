"use client";



import { useState } from "react";

interface Insight {
  type: "theme" | "tone" | "angle" | "trend";
  label: string;
  value: string;
  frequency?: number;
}

export default function ResearchPage() {
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [lastResearch, setLastResearch] = useState("Never");

  const analyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setInsights([
        { type: "theme", label: "Temas recurrentes", value: "AI agents, automation, productivity", frequency: 8 },
        { type: "theme", label: "Segundo tema", value: "Startup growth, founder mindset", frequency: 5 },
        { type: "tone", label: "Tono detectado", value: "Directo, opinionado, sin relleno. Abre con tesis fuerte." },
        { type: "angle", label: "Ángulo sugerido 1", value: "Por qué los agentes sin memoria son autocomplete caro" },
        { type: "angle", label: "Ángulo sugerido 2", value: "Cómo escalar voz sin perder autenticidad" },
        { type: "angle", label: "Ángulo sugerido 3", value: "La infraestructura de marca en 2025" },
        { type: "trend", label: "Trending topic", value: "#AIAgents mencionado 12 veces en últimas 48h" },
        { type: "trend", label: "Trending topic", value: "Voice cloning + brand identity en alza" },
      ]);
      setLastResearch("Ahora");
      setAnalyzing(false);
    }, 2000);
  };

  const applyToBrain = () => {
    alert("3 insights aplicados al Brand Brain");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Research Agent</h1>
        <div className="text-xs text-slate-500">Last research: {lastResearch}</div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Account Research</h2>
        <p className="mt-2 text-sm text-slate-600">Analiza perfiles públicos para detectar temas, tono y ángulos de contenido en 30 segundos.</p>
        <div className="mt-4 flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://linkedin.com/in/founder o https://x.com/username"
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500"
          />
          <button
            onClick={analyze}
            disabled={!url || analyzing}
            className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>

      {insights.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Temas recurrentes</h3>
              <div className="mt-4 space-y-2">
                {insights.filter((i) => i.type === "theme").map((i, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-sm text-slate-700">{i.value}</span>
                    {i.frequency && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">{i.frequency}x</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Tono/Vibe detectado</h3>
              <div className="mt-4">
                {insights.filter((i) => i.type === "tone").map((i, idx) => (
                  <p key={idx} className="text-sm leading-7 text-slate-700">{i.value}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Ángulos sugeridos</h3>
            <div className="mt-4 space-y-2">
              {insights.filter((i) => i.type === "angle").map((i, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="mt-0.5 text-brand-600">→</span>
                  <p className="text-sm text-slate-700">{i.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Trending topics</h3>
            <div className="mt-4 space-y-2">
              {insights.filter((i) => i.type === "trend").map((i, idx) => (
                <div key={idx} className="rounded-lg bg-green-50 px-4 py-3">
                  <p className="text-sm font-medium text-green-900">{i.value}</p>
                </div>
              ))}
            </div>
          </div>

          <button onClick={applyToBrain} className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700">
            Apply insights to Brand Brain
          </button>
        </>
      )}
    </div>
  );
}