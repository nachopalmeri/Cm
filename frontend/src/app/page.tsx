"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import VoiceTool from "@/components/VoiceTool";
import { Button } from "@/components/ui/button";

const SERIF = { fontFamily: "'Instrument Serif', Georgia, serif" } as const;

function useCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setCount(Math.floor(eased * target));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { count, ref };
}

function Stat({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const { count, ref } = useCounter(value);
  return (
    <div ref={ref} className="flex flex-col gap-1">
      <span className="text-4xl font-bold text-white tabular-nums" style={SERIF}>
        {count.toLocaleString("es-AR")}{suffix}
      </span>
      <span className="text-xs uppercase tracking-widest text-stone-500">{label}</span>
    </div>
  );
}

const TICKER = ["Memoria persistente entre sesiones","Feedback loop real que mejora el prompt","Drafts en segundos","Aprobas vos, siempre","X · LinkedIn · Substack · TikTok","Analisis de correcciones automatico","Voz que no suena a IA generica","Sin auto-posting. Sin sorpresas."];

const COMPARE = [
  { feat: "Genera contenido",         chatgpt: true,  taplio: true,  hyp: false, ours: true },
  { feat: "Aprende tu voz",           chatgpt: false, taplio: "~",   hyp: false, ours: true },
  { feat: "Memoria persistente",      chatgpt: false, taplio: false, hyp: false, ours: true },
  { feat: "Aprende de correcciones",  chatgpt: false, taplio: false, hyp: false, ours: true },
  { feat: "Multi-plataforma",         chatgpt: true,  taplio: "~",   hyp: "~",   ours: true },
  { feat: "Aprobas vos",              chatgpt: true,  taplio: true,  hyp: "~",   ours: true },
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true)  return <span className="text-emerald-400 font-bold text-base">&#10003;</span>;
  if (v === false) return <span className="text-stone-700 text-base">&#10007;</span>;
  return <span className="text-stone-500">&#126;</span>;
}

export default function Home() {
  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(232,131,74,0.13), transparent)" }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E\")" }} />

        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-[1fr_400px] gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E8834A]/30 bg-[#E8834A]/8 text-[#E8834A] text-xs font-medium tracking-widest uppercase mb-8">
                <span className="w-1.5 h-1.5 bg-[#E8834A] rounded-full animate-pulse" />
                Ghostwriter AI · Pisculichi Labs
              </div>

              <h1 className="font-bold leading-[0.92] tracking-tight mb-8" style={{ ...SERIF, fontSize: "clamp(3rem,8vw,6.5rem)" }}>
                <span className="block text-white">Tu voz.</span>
                <span className="block text-[#E8834A] italic">Tu memoria.</span>
                <span className="block text-white">Cada vez.</span>
              </h1>

              <p className="text-stone-400 text-lg leading-relaxed max-w-lg mb-10">
                El unico ghostwriter que aprende exactamente como escribis vos.
                Con cada correccion que haces, se vuelve{" "}
                <span className="text-stone-200">mas vos</span>.
              </p>

              <div className="flex flex-wrap gap-4 mb-16">
                <Button asChild size="lg"><Link href="#tool">Analiza tu voz gratis</Link></Button>
                <Button asChild variant="outline" size="lg"><Link href="#how">Ver como funciona</Link></Button>
              </div>

              <div className="flex items-end gap-10 flex-wrap">
                <Stat value={847}   label="Fundadores activos" />
                <div className="w-px h-10 bg-white/10 self-center hidden sm:block" />
                <Stat value={12400} label="Drafts generados" />
                <div className="w-px h-10 bg-white/10 self-center hidden sm:block" />
                <Stat value={94}    label="Aprobacion 1er draft" suffix="%" />
              </div>
            </div>

            {/* preview card */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-1 rounded-sm blur-xl" style={{ background: "linear-gradient(to bottom, rgba(232,131,74,0.2), transparent)" }} />
                <div className="relative bg-stone-900 border border-white/10 rounded-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-stone-500">Draft generado</span>
                    <span className="text-xs text-[#E8834A] bg-[#E8834A]/10 px-2 py-0.5 rounded-sm">X / Twitter</span>
                  </div>
                  <p className="text-stone-200 text-sm leading-relaxed">
                    "Los agentes AI sin memoria son autocomplete con traje.<br /><br />
                    El 90% de los builders lo ignora hasta que ya es tarde.<br /><br />
                    Yo lo ignore por 6 meses."
                  </p>
                  <div className="flex gap-2 pt-2 border-t border-white/8">
                    <button className="flex-1 text-xs py-2 bg-[#E8834A] text-stone-950 font-semibold rounded-sm hover:bg-[#C4622D] transition-colors">
                      &#10003; Aprobar
                    </button>
                    <button className="flex-1 text-xs py-2 border border-white/15 text-stone-400 rounded-sm hover:border-white/30 transition-colors">
                      &#10007; Rechazar
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs text-stone-600">Memoria activa · 24 entradas guardadas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="border-y border-white/8 bg-stone-900 py-3 overflow-hidden">
        <div className="flex" style={{ width: "max-content", animation: "ticker 40s linear infinite" }}>
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="text-xs uppercase tracking-widest text-stone-500 whitespace-nowrap px-8">
              {i % 2 === 0 && <span className="text-[#E8834A] mr-6">&#9670;</span>}{t}
            </span>
          ))}
        </div>
      </div>

      {/* PROBLEM */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-widest text-stone-600 mb-6">El problema real</p>
          <h2 className="font-bold leading-tight text-stone-200 mb-6" style={{ ...SERIF, fontSize: "clamp(2rem,5vw,3.5rem)" }}>
            Las IAs escriben. Pero no escriben{" "}
            <span className="text-[#E8834A] italic">como vos</span>.
          </h2>
          <p className="text-stone-500 text-lg leading-relaxed">
            ChatGPT no recuerda tu voz. Taplio da templates genericos. Hypefury solo schedulea.
            Ninguno aprende de las correcciones que haces. Cada vez empezas de cero.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-24 max-w-6xl mx-auto px-6 scroll-mt-20">
        <p className="text-xs uppercase tracking-widest text-stone-600 mb-4">El proceso</p>
        <h2 className="font-bold leading-tight mb-20" style={{ ...SERIF, fontSize: "clamp(2.5rem,5vw,4rem)" }}>
          <span className="text-white">Tres pasos.</span><br />
          <span className="text-[#E8834A] italic">Un solo resultado.</span>
        </h2>

        <div className="border-t border-white/8">
          {[
            {
              num: "01", title: "Ingresas tu contenido",
              body: "Pegas tweets, posts, notas — cualquier cosa que hayas escrito vos. El sistema construye tu perfil de voz: tono, ritmo, vocabulario, estructuras tipicas.",
              visual: (
                <div className="bg-stone-900 border border-white/8 rounded-sm p-5 font-mono text-xs space-y-2">
                  <div><span className="text-[#E8834A]">"voice":</span> <span className="text-stone-400">"builder irreverente que shipea rapido"</span></div>
                  <div><span className="text-[#E8834A]">"tone":</span>  <span className="text-stone-400">"casual, data-driven, sin fluff"</span></div>
                  <div><span className="text-[#E8834A]">"style":</span> <span className="text-stone-400">"parrafos cortos, hooks con pregunta"</span></div>
                  <div><span className="text-[#E8834A]">"avoid":</span> <span className="text-stone-400">"buzzwords, frases genericas"</span></div>
                </div>
              ),
            },
            {
              num: "02", title: "Generas drafts",
              body: "Elegis tema y plataforma. Recibes 3 versiones que suenan como vos, no como ChatGPT. Aprobas, rechazas o correges con una palabra.",
              visual: (
                <div className="bg-stone-900 border border-white/8 rounded-sm p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-600">X Twitter · Draft 2/3</span>
                    <span className="text-xs text-[#E8834A]">generado</span>
                  </div>
                  <p className="text-sm text-stone-300 leading-relaxed">
                    "Los agentes AI sin memoria son autocomplete con traje.<br /><br />
                    El 90% de los builders lo ignora hasta que ya es tarde."
                  </p>
                  <div className="flex gap-2">
                    <span className="text-xs px-3 py-1.5 bg-[#E8834A] text-stone-950 font-semibold rounded-sm">&#10003; Aprobar</span>
                    <span className="text-xs px-3 py-1.5 border border-white/15 text-stone-500 rounded-sm">&#10007; Rechazar</span>
                  </div>
                </div>
              ),
            },
            {
              num: "03", title: "La memoria aprende",
              body: "Cada correccion alimenta el sistema. Las frases que reemplazas, los temas que agregas, la estructura que preferis — todo queda en BrandMemory y el proximo draft es mejor.",
              visual: (
                <div className="bg-stone-900 border border-white/8 rounded-sm p-5 space-y-2.5">
                  {[
                    { ok: true,  txt: "Aprobado — tono directo, hook con pregunta" },
                    { ok: false, txt: "Corregido — evitar 'amazing', agregar datos" },
                    { ok: true,  txt: "Aprobado — estructura: insight + evidencia" },
                    { ok: true,  txt: "Aprobado — parrafos cortos, cierre con CTA" },
                  ].map((e, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${e.ok ? "bg-emerald-400" : "bg-[#E8834A]"}`} />
                      <span className="text-xs text-stone-400">{e.txt}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/8">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs text-stone-600 uppercase tracking-widest">memoria activa</span>
                  </div>
                </div>
              ),
            },
          ].map((step, i) => (
            <div key={i} className={`grid md:grid-cols-[80px_1fr_1fr] gap-8 py-12 border-b border-white/8 items-start`}>
              <span className="font-bold text-stone-800" style={{ ...SERIF, fontSize: "3rem" }}>{step.num}</span>
              <div>
                <h3 className="font-bold text-white mb-4" style={{ ...SERIF, fontSize: "1.5rem" }}>{step.title}</h3>
                <p className="text-stone-400 text-base leading-relaxed">{step.body}</p>
              </div>
              <div>{step.visual}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FREE TOOL */}
      <section id="tool" className="py-24 bg-stone-900 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-start">
            <div>
              <p className="text-xs uppercase tracking-widest text-stone-600 mb-4">Herramienta gratuita</p>
              <h2 className="font-bold leading-tight mb-6" style={{ ...SERIF, fontSize: "clamp(2.5rem,5vw,4rem)" }}>
                <span className="text-white">Descubri tu</span><br />
                <span className="text-[#E8834A] italic">perfil de voz</span>
              </h2>
              <p className="text-stone-400 text-base leading-relaxed">
                Pega 3 a 5 de tus posts o tweets. El sistema analiza tu tono, estilo y temas recurrentes.
                Gratis, sin registro, en segundos.
              </p>
            </div>
            <VoiceTool />
          </div>
        </div>
      </section>

      {/* DIFFERENTIATORS */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <p className="text-xs uppercase tracking-widest text-stone-600 mb-4">Por que funciona</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 border border-white/8">
          {[
            { icon: "&#8853;", title: "Memoria real entre sesiones",      body: "No es un contexto que se borra. Cada aprobacion y correccion queda en tu BrandMemory permanentemente.",                                                                        featured: false },
            { icon: "&#9672;", title: "Feedback loop que mejora el prompt", body: "Cuando correges un draft, el sistema extrae que frases reemplazaste y que temas agregaste. El proximo generate ya los incorpora.", featured: true  },
            { icon: "&#8856;", title: "Aprobas vos. Siempre.",             body: "Nada se publica automaticamente. El ghostwriter propone, vos decides.",                                                                                                           featured: false },
            { icon: "&#8855;", title: "Telegram-native",                   body: "Usalo con /ghost y /ingest desde Telegram. Sin dashboard obligatorio.",                                                                                                           featured: false },
          ].map((d, i) => (
            <div key={i} className={`p-8 border-r border-b border-white/8 last:border-r-0 relative ${d.featured ? "bg-stone-900" : "hover:bg-white/[0.02] transition-colors"}`}>
              <div className="text-[#E8834A] text-2xl mb-5" dangerouslySetInnerHTML={{ __html: d.icon }} />
              <h3 className={`font-bold mb-3 leading-snug ${d.featured ? "text-white" : "text-stone-200"}`} style={{ ...SERIF, fontSize: "1.1rem" }}>{d.title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{d.body}</p>
              {d.featured && <span className="absolute top-6 right-6 text-xs px-2 py-0.5 border border-[#E8834A]/40 text-[#E8834A] rounded-sm tracking-widest uppercase">El diferencial</span>}
            </div>
          ))}
        </div>
      </section>

      {/* COMPARISON */}
      <section className="py-24 bg-stone-900">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs uppercase tracking-widest text-stone-600 mb-4">Comparativa</p>
          <h2 className="font-bold leading-tight mb-12" style={{ ...SERIF, fontSize: "clamp(2.5rem,5vw,4rem)" }}>
            <span className="text-white">Todos generan.</span><br />
            <span className="text-[#E8834A] italic">Solo uno aprende.</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left py-4 pr-8 text-xs uppercase tracking-widest text-stone-600 font-medium">Feature</th>
                  {["ChatGPT","Taplio","Hypefury"].map(h => (
                    <th key={h} className="py-4 px-6 text-xs uppercase tracking-widest text-stone-600 font-medium text-center">{h}</th>
                  ))}
                  <th className="py-4 px-6 text-xs uppercase tracking-widest text-[#E8834A] font-medium text-center bg-[#E8834A]/5">Ghostwriter</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-4 pr-8 text-stone-300 font-medium">{row.feat}</td>
                    <td className="py-4 px-6 text-center"><Cell v={row.chatgpt} /></td>
                    <td className="py-4 px-6 text-center"><Cell v={row.taplio} /></td>
                    <td className="py-4 px-6 text-center"><Cell v={row.hyp} /></td>
                    <td className="py-4 px-6 text-center bg-[#E8834A]/5 text-emerald-400 font-bold"><Cell v={row.ours} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 max-w-6xl mx-auto px-6 scroll-mt-20">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-widest text-stone-600 mb-4">Precios</p>
          <h2 className="font-bold leading-tight" style={{ ...SERIF, fontSize: "clamp(2.5rem,5vw,4rem)" }}>
            <span className="text-white">Simple. </span>
            <span className="text-[#E8834A] italic">Sin sorpresas.</span>
          </h2>
          <p className="text-stone-500 mt-4">7 dias gratis. Sin tarjeta de credito.</p>
        </div>
        <div className="grid md:grid-cols-2 max-w-2xl mx-auto border border-white/8">
          {[
            { name: "Starter", price: 19, featured: false, features: ["50 drafts por mes","Voice memory persistente","X + LinkedIn","Feedback loop basico","Telegram bot"] },
            { name: "Pro",     price: 49, featured: true,  features: ["Drafts ilimitados","X · LinkedIn · Substack · TikTok","Feedback loop completo","Voice profile export","Soporte prioritario","Early access a nuevas features"] },
          ].map((plan, i) => (
            <div key={i} className={`p-8 border-r border-white/8 last:border-r-0 relative ${plan.featured ? "bg-stone-900" : ""}`}>
              {plan.featured && <div className="absolute top-6 right-6 text-xs px-2 py-0.5 border border-[#E8834A]/40 text-[#E8834A] rounded-sm tracking-widest uppercase">Mas elegido</div>}
              <div className={`font-bold mb-2 ${plan.featured ? "text-white" : "text-stone-300"}`} style={{ ...SERIF, fontSize: "1.25rem" }}>{plan.name}</div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-white font-bold" style={{ ...SERIF, fontSize: "3rem" }}>${plan.price}</span>
                <span className="text-stone-500 text-sm">/mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-stone-400">
                    <span className="text-[#E8834A] mt-0.5">&#8594;</span>{f}
                  </li>
                ))}
              </ul>
              <Button asChild variant={plan.featured ? "default" : "outline"} className="w-full" size="lg">
                <Link href="#tool">Empezar gratis &#8594;</Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="text-center text-stone-600 text-sm mt-6">Annual: <span className="text-stone-400">25% de descuento</span>. Cancelas cuando queres.</p>
      </section>

      {/* MANIFESTO */}
      <section className="py-32 bg-stone-950 border-t border-white/8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <blockquote className="font-bold leading-tight text-stone-300 mb-10" style={{ ...SERIF, fontSize: "clamp(1.75rem,4vw,3rem)" }}>
            "La voz es el unico activo que no te pueden copiar.
            <span className="text-[#E8834A] italic"> Protegela. Escalala. Hacela tuya.</span>"
          </blockquote>
          <Button asChild size="lg"><Link href="#tool">Empeza hoy &#8212; es gratis &#8594;</Link></Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/8 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-white" style={SERIF}>GW</span>
            <span className="text-xs text-stone-600 uppercase tracking-widest">by Pisculichi Labs</span>
          </div>
          <div className="flex gap-6">
            <a href="mailto:ipalmeri@uade.edu.ar" className="text-sm text-stone-600 hover:text-[#E8834A] transition-colors">Contacto</a>
            <a href="https://github.com/nachopalmeri/Cm" target="_blank" rel="noreferrer" className="text-sm text-stone-600 hover:text-[#E8834A] transition-colors">GitHub</a>
            <Link href="#pricing" className="text-sm text-stone-600 hover:text-[#E8834A] transition-colors">Precios</Link>
          </div>
          <p className="text-xs text-stone-700">&#169; 2025 Pisculichi Labs</p>
        </div>
      </footer>
    </>
  );
}