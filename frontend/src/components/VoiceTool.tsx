"use client";
import { useState } from "react";
import { Button } from "./ui/button";

type VoiceResult = { tone: string; style: string; topics: string[]; hook: string; };

function analyzeLocally(text: string): VoiceResult {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const sentences = (text.match(/[.!?]+/g) || []).length || 1;
  const avgLen = words.length / sentences;

  let tone = "directo y claro";
  if (lower.includes("ship") || lower.includes("lanzar")) tone = "builder de accion rapida";
  else if (lower.includes("datos") || lower.includes("data") || lower.includes("%")) tone = "data-driven, pragmatico";
  else if ((text.match(/\?/g) || []).length > 1) tone = "inquisitivo, genera debate";
  else if ((text.match(/!/g) || []).length > 2) tone = "energetico, con conviccion";

  const style = avgLen < 7 ? "frases cortas y contundentes" : avgLen < 14 ? "parrafos equilibrados, fluidos" : "narrativo, desarrolla ideas en profundidad";

  const topicMap: [string, string][] = [
    ["ai","Inteligencia Artificial"],["agente","AI Agents"],["startup","Startups"],
    ["saas","SaaS"],["build","Builders"],["product","Producto"],["ship","Shipping"],
    ["data","Datos"],["tech","Tecnologia"],["lanzar","Lanzamiento"],["aprender","Aprendizaje"],
    ["memory","Memoria"],["founder","Founders"],
  ];
  const topics = topicMap.filter(([k]) => lower.includes(k)).map(([, v]) => v).slice(0, 5);
  if (topics.length === 0) topics.push("Ideas propias", "Experiencias personales");

  const firstSent = text.split(/[.!?]/)[0]?.trim() ?? text.substring(0, 60);
  const hook = firstSent.length > 60 ? firstSent.substring(0, 60) + "..." : firstSent;

  return { tone, style, topics, hook };
}

export default function VoiceTool() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = () => {
    if (text.trim().length < 20) return;
    setLoading(true);
    setTimeout(() => { setResult(analyzeLocally(text)); setLoading(false); }, 900);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium tracking-widest uppercase text-stone-500 mb-3">
          Tus posts (3-5 ejemplos, uno por parrafo)
        </label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={7}
          placeholder="Pega aca tus tweets o posts...&#10;&#10;Ejemplo:&#10;Shipiemos el MVP. La perfeccion es el enemigo del lanzamiento.&#10;&#10;Los agentes AI sin memoria son solo autocomplete con contexto."
          className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-stone-200 placeholder:text-stone-600 resize-y focus:outline-none focus:border-[#E8834A] transition-colors leading-relaxed"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        />
      </div>
      <Button onClick={analyze} disabled={text.trim().length < 20 || loading} className="w-full" size="lg">
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" />
            Analizando tu voz...
          </span>
        ) : "Analizar mi voz \u2192"}
      </Button>
      {result && (
        <div className="border border-[#E8834A]/30 bg-[#E8834A]/5 rounded-sm p-5 space-y-4" style={{ animation: "fadeIn 0.4s ease forwards" }}>
          <p className="text-xs font-medium tracking-widest uppercase text-[#E8834A]">Perfil de voz detectado</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-stone-500 mb-1">Tono</p>
              <p className="text-sm font-medium text-stone-100">{result.tone}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-stone-500 mb-1">Estilo</p>
              <p className="text-sm font-medium text-stone-100">{result.style}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">Temas recurrentes</p>
              <div className="flex flex-wrap gap-2">
                {result.topics.map(t => (
                  <span key={t} className="text-xs px-2 py-1 bg-[#E8834A]/15 text-[#E8834A] border border-[#E8834A]/25 rounded-sm">{t}</span>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-widest text-stone-500 mb-1">Hook tipico tuyo</p>
              <p className="text-sm italic text-stone-400">"{result.hook}"</p>
            </div>
          </div>
          <div className="pt-3 border-t border-white/8">
            <p className="text-sm text-stone-400 mb-3">Queres que el ghostwriter genere con esta voz?</p>
            <Button asChild size="lg" className="w-full"><a href="#pricing">Empezar prueba de 7 dias \u2192</a></Button>
          </div>
        </div>
      )}
    </div>
  );
}