"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";

const Hero3D = dynamic(() => import("@/components/Hero3D"), { ssr: false });

function useInView(t = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.unobserve(el); } }, { threshold: t });
    o.observe(el);
    return () => o.disconnect();
  }, [t]);
  return { ref, visible: v };
}

function Section({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useInView();
  return <div ref={ref} className={visible ? `animate-fade-up opacity-0 ` + className : `opacity-0 ` + className} style={{ animationDelay: delay + "ms" }}>{children}</div>;
}

function TypewriterDemo() {
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [cur, setCur] = useState(true);
  const full = "No necesitas mas horas escribiendo. Necesitas un sistema que escriba como vos, con tu tono, tu estilo, tu voz.";
  const gen = () => {
    if (!topic.trim() || typing) return;
    setDraft(""); setTyping(true);
    let i = 0;
    const t = setInterval(() => { setDraft(full.slice(0, i + 1)); i++; if (i >= full.length) { clearInterval(t); setTyping(false); } }, 30);
  };
  useEffect(() => { const b = setInterval(() => setCur(c => !c), 530); return () => clearInterval(b); }, []);
  return (
    <div className="bg-surface/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 space-y-5">
      <div className="flex items-center gap-2 text-xs text-muted font-accent uppercase tracking-widest">
        <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
        ghostwriter ? demo en vivo
      </div>
      <div className="flex gap-2">
        <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && gen()} placeholder="Escribe un tema..." className="flex-1 bg-transparent border border-white/10 rounded-xl px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-peach/40 focus:outline-none transition-colors" />
        <button onClick={gen} disabled={typing || !topic.trim()} className="bg-peach text-background px-5 py-3 rounded-xl text-sm font-semibold disabled:opacity-30 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(232,168,124,0.3)]">
          {typing ? "..." : "Generar"}
        </button>
      </div>
      <div className="min-h-[80px] bg-background/50 rounded-xl p-4 font-accent text-sm text-secondary leading-relaxed">
        {draft}
        <span className={"inline-block w-[2px] h-4 bg-peach ml-0.5 align-middle " + (cur ? "opacity-100" : "opacity-0")} />
      </div>
    </div>
  );
}

function AnimatedCounter({ target, duration = 1500, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setActive(true); o.disconnect(); } }, { threshold: 0.3 });
    o.observe(el);
    return () => o.disconnect();
  }, []);
  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    const t = setInterval(() => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setCount(Math.floor(eased * target));
      if (p === 1) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [active, target, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Suspense fallback={null}>
            <Hero3D />
          </Suspense>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background z-[1]" />
        <div className="max-w-6xl mx-auto w-full relative z-10 pt-20">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-16 items-center">
            <div className="space-y-10">
              <div className="space-y-6">
                <p className="font-accent text-[10px] uppercase tracking-[0.3em] text-peach">El ghostwriter que aprende</p>
                <h1 className="font-display text-[clamp(56px,10vw,160px)] leading-[0.85] tracking-tight">
                  <span className="text-primary">Escribe</span><br />
                  <span className="text-primary/60">como vos.</span><br />
                  <span className="text-secondary/40">A escala.</span>
                </h1>
                <p className="text-lg text-secondary max-w-md leading-relaxed">
                  Ghostwriter aprende tu voz, recuerda tus correcciones y genera contenido que suena a vos. Sin prompts genericos. Sin copy de robot.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <a href="#tool" className="bg-peach text-background px-8 py-4 rounded-2xl text-sm font-semibold tracking-wide hover:bg-peach/90 hover:shadow-[0_0_40px_rgba(232,168,124,0.25)] transition-all duration-300">
                  Probar gratis
                </a>
                <a href="#how" className="text-secondary text-sm hover:text-primary transition-colors border border-white/10 px-6 py-4 rounded-2xl hover:border-white/20">
                  Como funciona
                </a>
              </div>
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/5">
                <div>
                  <div className="font-display text-4xl text-primary"><AnimatedCounter target={24} /></div>
                  <p className="text-muted text-xs mt-1 font-accent uppercase tracking-widest">Entradas</p>
                </div>
                <div>
                  <div className="font-display text-4xl text-primary"><AnimatedCounter target={3} /></div>
                  <p className="text-muted text-xs mt-1 font-accent uppercase tracking-widest">Versiones</p>
                </div>
                <div>
                  <div className="font-display text-4xl text-primary"><AnimatedCounter target={0} /></div>
                  <p className="text-muted text-xs mt-1 font-accent uppercase tracking-widest">Prompts genericos</p>
                </div>
              </div>
            </div>
            <TypewriterDemo />
          </div>
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <Section delay={0}>
            <p className="font-accent text-[10px] uppercase tracking-[0.3em] text-muted mb-4">Capacidades</p>
            <h2 className="font-display text-4xl md:text-5xl text-primary mb-16 max-w-xl leading-tight">
              Todo lo que necesitas para escribir a escala.
            </h2>
          </Section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Section delay={100} className="lg:col-span-2">
              <div className="group bg-surface/50 border border-white/5 rounded-3xl p-8 h-full hover:border-peach/20 hover:-translate-y-1 transition-all duration-500">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-peach font-accent text-xs uppercase tracking-widest">01</span>
                  <h3 className="text-xl font-display text-primary">Memoria persistente</h3>
                </div>
                <p className="text-secondary leading-relaxed">Cada aprobacion, cada correccion, cada rechazo alimenta un perfil de voz que mejora con el tiempo. La proxima generacion sera mas precisa que la anterior.</p>
              </div>
            </Section>
            <Section delay={200}>
              <div className="group bg-surface/50 border border-white/5 rounded-3xl p-8 h-full hover:border-mint/20 hover:-translate-y-1 transition-all duration-500">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-mint font-accent text-xs uppercase tracking-widest">02</span>
                  <h3 className="text-xl font-display text-primary">Multiplataforma</h3>
                </div>
                <p className="text-secondary leading-relaxed">X, Substack, LinkedIn, TikTok. Mismo tema, distinto formato. Adaptacion nativa por plataforma.</p>
              </div>
            </Section>
            <Section delay={300}>
              <div className="group bg-surface/50 border border-white/5 rounded-3xl p-8 h-full hover:border-lavender/20 hover:-translate-y-1 transition-all duration-500">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-lavender font-accent text-xs uppercase tracking-widest">03</span>
                  <h3 className="text-xl font-display text-primary">Loop de feedback</h3>
                </div>
                <p className="text-secondary leading-relaxed">Aprobas un draft? Aprende. Rechazas? Aprende mas. Corregis una frase? Eso pesa mas que mil ejemplos.</p>
              </div>
            </Section>
            <Section delay={400} className="lg:col-span-2">
              <div className="group bg-surface/50 border border-white/5 rounded-3xl p-8 h-full hover:border-rose/20 hover:-translate-y-1 transition-all duration-500">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-rose font-accent text-xs uppercase tracking-widest">04</span>
                  <h3 className="text-xl font-display text-primary">Privacidad total</h3>
                </div>
                <p className="text-secondary leading-relaxed">Tu voz no entrena modelos publicos. Tu data es tuya. Borrala cuando quieras. Sin compromisos ocultos.</p>
              </div>
            </Section>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-32 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 bottom-0 left-[28px] md:left-[72px] w-[1px] bg-gradient-to-b from-peach/20 via-lavender/15 to-transparent" />
        <div className="max-w-6xl mx-auto">
          <Section delay={0}>
            <p className="font-accent text-[10px] uppercase tracking-[0.3em] text-muted mb-4">Proceso</p>
            <h2 className="font-display text-4xl md:text-5xl text-primary mb-20 max-w-xl leading-tight">
              De cero a tu voz en tres pasos.
            </h2>
          </Section>
          <div className="space-y-20">
            {[
              { n: "01", title: "Ingesta", desc: "Pegas tus posts, tweets, newsletters. El sistema extrae tu tono, ritmo, vocabulario y temas recurrentes. No importa el formato.", color: "bg-peach" },
              { n: "02", title: "Genera", desc: "Escribis un tema y elegis la plataforma. El sistema genera tres versiones distintas, cada una con tu voz, adaptada al formato que necesitas.", color: "bg-lavender" },
              { n: "03", title: "Refina", desc: "Aprobas, rechazas o corregis. Cada decision alimenta la memoria. La proxima vez, acierta de entrada.", color: "bg-mint" },
            ].map((s, i) => (
              <Section key={i} delay={i * 150} className="relative pl-14 md:pl-32">
                <span className="font-display text-[clamp(60px,10vw,140px)] leading-none text-white/[0.025] absolute -top-4 left-0 select-none">{s.n}</span>
                <div className={`w-3 h-3 rounded-full ${s.color} absolute left-[22px] md:left-[66px] top-2`} />
                <div className="relative z-10">
                  <h3 className="font-display text-3xl md:text-4xl text-primary mb-4">{s.title}</h3>
                  <p className="text-secondary max-w-md leading-relaxed text-lg">{s.desc}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* FREE TOOL */}
      <section id="tool" className="py-32 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <Section delay={0}>
            <p className="font-accent text-[10px] uppercase tracking-[0.3em] text-muted mb-4">Herramienta gratuita</p>
            <h2 className="font-display text-4xl md:text-5xl text-primary mb-4 leading-tight">Descubri tu voz</h2>
            <p className="text-secondary mb-16 text-lg max-w-lg">Analiza tu tono, estilo y temas en segundos. Sin registro.</p>
          </Section>
          <Section delay={200}><VoiceToolSection /></Section>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <Section delay={0}>
            <p className="font-accent text-[10px] uppercase tracking-[0.3em] text-muted mb-4">Comparativa</p>
            <h2 className="font-display text-4xl md:text-5xl text-primary mb-16 leading-tight">Ghostwriter vs el resto.</h2>
          </Section>
          <div className="grid grid-cols-1 md:grid-cols-2 border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/5">
              <h3 className="font-accent text-xs uppercase tracking-widest text-peach mb-10">Ghostwriter</h3>
              <ul className="space-y-5">
                {["Memoria de voz persistente","Loop de feedback con correcciones","Adaptacion nativa por plataforma","Perfil de voz unico","Sin prompts genericos","Privacidad total"].map((f,i) => (
                  <li key={i} className="text-primary/80 text-sm flex items-start gap-3">
                    <span className="text-peach mt-0.5 font-display">?</span>{f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-8 md:p-12">
              <h3 className="font-accent text-xs uppercase tracking-widest text-muted mb-10">Otros</h3>
              <ul className="space-y-5">
                {["Sin memoria entre sesiones","Sin aprendizaje de correcciones","Formato unico para todas","Prompts genericos","Copy de IA detectable","Datos en servidores compartidos"].map((f,i) => (
                  <li key={i} className="text-primary/20 text-sm flex items-start gap-3">
                    <span className="mt-0.5">?</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-32 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <Section delay={0}>
            <p className="font-accent text-[10px] uppercase tracking-[0.3em] text-muted mb-4">Precios</p>
            <h2 className="font-display text-4xl md:text-5xl text-primary mb-16 leading-tight">Simple. Sin sorpresas.</h2>
          </Section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            <Section delay={100}>
              <div className="bg-surface/50 border border-white/5 rounded-3xl p-10 h-full hover:border-white/10 transition-all duration-500">
                <h3 className="text-lg font-display text-primary mb-2">Gratis</h3>
                <p className="text-muted text-sm font-accent mb-8">Para probar la voz</p>
                <div className="font-display text-5xl text-primary mb-8">$0<span className="text-base text-muted">/mes</span></div>
                <ul className="space-y-3 text-secondary text-sm"><li>Analisis de voz</li><li>3 drafts de prueba</li><li>1 plataforma</li></ul>
              </div>
            </Section>
            <Section delay={200}>
              <div className="bg-peach rounded-3xl p-10 h-full hover:shadow-[0_0_60px_rgba(232,168,124,0.15)] transition-all duration-500">
                <h3 className="text-lg font-display text-background mb-2">Pro</h3>
                <p className="text-background/50 text-sm font-accent mb-8">Para creadores serios</p>
                <div className="font-display text-5xl text-background mb-8">$29<span className="text-base text-background/50">/mes</span></div>
                <ul className="space-y-3 text-background/70 text-sm"><li>Memoria ilimitada</li><li>Multiplataforma</li><li>Loop de feedback</li><li>Exportar drafts</li><li>Soporte prioritario</li></ul>
              </div>
            </Section>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="py-48 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="morph-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(232,168,124,0.04),transparent)] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Section delay={0}>
            <p className="font-display text-3xl md:text-5xl lg:text-6xl text-primary italic leading-tight">
              &ldquo;La IA no deberia sonar a IA.<br />Deberia sonar a vos.&rdquo;
            </p>
          </Section>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="font-display text-xl text-primary">GW</span>
          <div className="flex gap-8 text-sm text-muted">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">GitHub</a>
            <a href="#" className="hover:text-primary transition-colors">Contacto</a>
          </div>
          <span className="text-xs text-muted/40 font-accent">2025 Ghostwriter</span>
        </div>
      </footer>
    </main>
  );
}

function VoiceToolSection() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<{tone:string;style:string;topics:string;hook:string}|null>(null);
  const [loading, setLoading] = useState(false);
  const analyze = () => {
    if (!text.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const words = text.split(/\s+/);
      const sentences = text.split(/[.!?]+/).filter(Boolean);
      const avg = words.length / Math.max(sentences.length, 1);
      const tone = avg < 12 ? "Directo, sin filtro" : avg < 20 ? "Balanceado, explicativo" : "Profundo, academico";
      const style = text.includes("?") && text.includes("!") ? "Interrogativo-energico" : text.includes("-") ? "Narrativo en bloques" : "Conversacional fluido";
      const first = sentences[0]?.trim() || "";
      setResult({ tone, style, topics: "Growth, producto, mindset", hook: first.length > 60 ? first.slice(0,60)+"..." : first });
      setLoading(false);
    }, 1800);
  };
  return (
    <div className="space-y-8">
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Pega aca 3 posts tuyos..." className="w-full h-48 bg-transparent border border-white/10 rounded-2xl p-6 text-primary/80 placeholder:text-muted focus:border-peach/40 focus:outline-none resize-none text-base leading-relaxed transition-colors" />
      <button onClick={analyze} disabled={loading} className="bg-peach text-background px-8 py-3 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 hover:shadow-[0_0_30px_rgba(232,168,124,0.3)] hover:scale-105 disabled:opacity-40">
        {loading ? "Analizando..." : "Descubri tu voz"}
      </button>
      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up">
          {([
            { label: "Tono", val: result.tone },
            { label: "Estilo", val: result.style },
            { label: "Temas", val: result.topics },
            { label: "Hook", val: `"${result.hook}"` },
          ] as {label:string;val:string}[]).map((r, i) => (
            <div key={i} className="bg-surface/50 border border-white/5 rounded-2xl p-6 hover:border-peach/20 transition-all duration-500">
              <span className="font-accent text-[10px] uppercase tracking-[0.3em] text-muted block mb-3">{r.label}</span>
              <p className="text-primary/80 font-display text-xl">{r.val}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
