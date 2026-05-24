"use client";
import { useMemo, useState } from "react";

const vibes = ["Founder agresivo", "Visionario tech", "Builder directo", "Consultor empático"];

export default function BrainBuilder() {
  const [source, setSource] = useState("");
  const [vibe, setVibe] = useState(vibes[2]);
  const [built, setBuilt] = useState(false);
  const [loading, setLoading] = useState(false);

  const profile = useMemo(() => {
    const text = source.toLowerCase();
    const direct = text.includes("no ") || text.includes("sin ") || text.includes("rápido") || text.includes("rapido");
    const technical = text.includes("ai") || text.includes("agente") || text.includes("saas") || text.includes("producto");
    return {
      tone: direct ? "Directo, opinionado, sin relleno" : "Claro, estratégico, con autoridad",
      topics: technical ? "AI agents · producto · distribución" : "marca personal · crecimiento · narrativa",
      rule: vibe.includes("agresivo") ? "Abrir con una tesis fuerte" : vibe.includes("empático") ? "Explicar sin sonar superior" : "Priorizar velocidad y claridad",
      platforms: technical ? "X thread · LinkedIn carousels · Newsletter técnica" : "X post · LinkedIn story · Newsletter personal",
    };
  }, [source, vibe]);

  const build = () => {
    if (source.trim().length < 12) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setBuilt(true); }, 1200);
  };

  return (
    <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[.95fr_1.05fr] lg:p-8">
      <div className="space-y-5">
        <div>
          <label className="text-xs font-medium text-slate-500">URL, post o idea cruda</label>
          <textarea
            value={source}
            onChange={(e) => { setSource(e.target.value); if (built) setBuilt(false); }}
            placeholder="Pegá tu LinkedIn, una idea, o 3 posts tuyos..."
            className="mt-2 min-h-32 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Vibe operativo</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {vibes.map((item) => (
              <button
                key={item}
                onClick={() => { setVibe(item); if (built) setBuilt(false); }}
                className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${vibe === item ? "border-brand-600 bg-brand-50 text-brand-700 font-semibold" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={build}
          disabled={source.trim().length < 12 || loading}
          className="w-full rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Construyendo Brain...
            </span>
          ) : "Generar Brand Brain"}
        </button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Brain preview</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">{built ? "Clon inicial listo" : "Esperando señal"}</h3>
          </div>
          <div className={`rounded-full border px-3 py-1 text-xs font-medium transition ${built ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-white text-slate-400"}`}>
            {built ? "94% match" : "idle"}
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {[
            { label: "Tono detectado", value: profile.tone },
            { label: "Territorio narrativo", value: profile.topics },
            { label: "Regla aprendida", value: profile.rule },
            { label: "Canales sugeridos", value: built ? profile.platforms : "Se activa al construir el Brain" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-100 bg-white p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{item.value}</p>
            </div>
          ))}
        </div>
        {built && (
          <div className="mt-4 rounded-lg border border-brand-100 bg-brand-50 p-4">
            <p className="text-sm font-semibold text-brand-700">¿Querés que tu Voice Agent empiece a ejecutar?</p>
            <a href="#onboarding" className="mt-3 inline-flex rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
              Activar prueba de 7 días →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
