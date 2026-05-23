"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import ParallaxLayer from "@/components/ParallaxLayer";
import AnimatedCounter from "@/components/AnimatedCounter";
import MagneticButton from "@/components/MagneticButton";
import MorphingBlob from "@/components/MorphingBlob";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Section({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={visible ? `animate-fade-slide-up delay-${delay * 100} ${className}` : `opacity-0 ${className}`}>
      {children}
    </div>
  );
}

function TypewriterDemo() {
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const fullDraft = "No necesitas mas horas para escribir contenido. Necesitas un sistema que escriba como vos.";

  const generate = () => {
    if (!topic.trim() || isTyping) return;
    setDraft("");
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      setDraft(fullDraft.slice(0, i + 1));
      i++;
      if (i >= fullDraft.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 35);
  };

  useEffect(() => {
    const blink = setInterval(() => setShowCursor(s => !s), 530);
    return () => clearInterval(blink);
  }, []);

  return (
    <div className="w-full max-w-2xl">
      <div className="bento-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2 text-xs text-white/30 font-mono">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          ghostwriter ? demo en vivo
        </div>
        <div className="relative">
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === "Enter" && generate()}
            placeholder="Escribe un tema..."
            className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-[#E8834A]/50 focus:outline-none transition-colors"
          />
          <button
            onClick={generate}
            disabled={isTyping || !topic.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#E8834A] text-[#0A0A0A] px-4 py-1.5 rounded-lg text-xs font-medium disabled:opacity-30 transition-opacity"
          >
            {isTyping ? "Escribiendo..." : "Generar"}
          </button>
        </div>
        <div className="min-h-[80px] bg-black/30 rounded-xl p-4 font-mono text-sm text-white/70 leading-relaxed">
          {draft}
          <span className={`inline-block w-[2px] h-4 bg-[#E8834A] ml-0.5 align-middle transition-opacity ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] selection:bg-[#E8834A] selection:text-[#0A0A0A] relative overflow-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 pt-24 pb-16">
        {/* Parallax decorations */}
        <ParallaxLayer speed={0.2} className="absolute top-20 left-10 opacity-30">
          <MorphingBlob size={400} opacity={0.08} />
        </ParallaxLayer>
        <ParallaxLayer speed={0.5} className="absolute top-40 right-20 opacity-20">
          <div className="w-32 h-32 rounded-full border border-[#E8834A]/10" />
        </ParallaxLayer>
        <ParallaxLayer speed={0.3} className="absolute bottom-40 left-1/4 opacity-15">
          <div className="w-2 h-64 bg-gradient-to-b from-[#E8834A]/20 to-transparent" />
        </ParallaxLayer>

        <div className="max-w-6xl mx-auto w-full relative z-10">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="font-serif text-[clamp(52px,9vw,140px)] leading-[0.9] tracking-tight gradient-text">
                  Escribe como<br />vos. A escala.
                </h1>
                <p className="text-lg md:text-xl text-white/40 max-w-lg leading-relaxed">
                  Un sistema que aprende tu voz, recuerda tus correcciones, y genera contenido que suena a vos ? no a un prompt gen?rico.
                </p>
              </div>
              <div className="flex items-center gap-6">
                <MagneticButton href="#tool" className="bg-[#E8834A] text-[#0A0A0A] px-7 py-3 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 hover:shadow-[0_0_40px_rgba(232,131,74,0.3)]">
                  Probar gratis
                </MagneticButton>
                <a href="#how" className="line-link text-sm text-white/40 hover:text-white transition-colors">
                  Ver como funciona
                </a>
              </div>
              {/* Stats with animated counters */}
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div>
                  <AnimatedCounter target={24} />
                  <p className="text-white/30 text-sm mt-2">Entradas de memoria</p>
                </div>
                <div>
                  <AnimatedCounter target={3} />
                  <p className="text-white/30 text-sm mt-2">Versiones por gen</p>
                </div>
                <div>
                  <AnimatedCounter target={0} />
                  <p className="text-white/30 text-sm mt-2">Prompts gen?ricos</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <TypewriterDemo />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section className="py-32 px-6 relative">
        <ParallaxLayer speed={0.15} className="absolute top-0 right-10 opacity-20">
          <MorphingBlob size={300} opacity={0.05} />
        </ParallaxLayer>

        <div className="max-w-6xl mx-auto">
          <Section delay={0}>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-4">Capacidades</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-16 max-w-xl">
              Todo lo que necesitas para escribir a escala.
            </h2>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Section delay={1} className="lg:col-span-2">
              <div className="bento-card p-8 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[#E8834A] font-mono text-sm">01</span>
                  <h3 className="text-xl font-medium text-white">Memoria persistente</h3>
                </div>
                <p className="text-white/40 leading-relaxed">
                  Cada aprobacion, cada correccion, cada rechazo alimenta un perfil de voz que mejora con el tiempo. La proxima generacion sera mas precisa que la anterior.
                </p>
              </div>
            </Section>

            <Section delay={2}>
              <div className="bento-card p-8 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[#E8834A] font-mono text-sm">02</span>
                  <h3 className="text-xl font-medium text-white">Multiplataforma</h3>
                </div>
                <p className="text-white/40 leading-relaxed">
                  X, Substack, LinkedIn, TikTok. Mismo tema, distinto formato. Adaptacion nativa por plataforma.
                </p>
              </div>
            </Section>

            <Section delay={3}>
              <div className="bento-card p-8 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[#E8834A] font-mono text-sm">03</span>
                  <h3 className="text-xl font-medium text-white">Loop de feedback</h3>
                </div>
                <p className="text-white/40 leading-relaxed">
                  Aprobas un draft? Aprende. Rechazas? Aprende mas. Corregis una frase? Eso pesa mas que mil ejemplos.
                </p>
              </div>
            </Section>

            <Section delay={4} className="lg:col-span-2">
              <div className="bento-card p-8 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[#E8834A] font-mono text-sm">04</span>
                  <h3 className="text-xl font-medium text-white">Privacidad total</h3>
                </div>
                <p className="text-white/40 leading-relaxed">
                  Tu voz no entrena modelos publicos. Tu data es tuya. Borrala cuando quieras. Sin compromisos.
                </p>
              </div>
            </Section>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-32 px-6 border-t border-white/5 relative">
        <ParallaxLayer speed={0.25} className="absolute top-20 left-1/3 opacity-10">
          <div className="w-1 h-96 bg-gradient-to-b from-[#E8834A]/30 to-transparent" />
        </ParallaxLayer>

        <div className="max-w-6xl mx-auto">
          <Section delay={0}>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-4">Proceso</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-20 max-w-xl">
              De cero a tu voz en tres pasos.
            </h2>
          </Section>

          <div className="space-y-24">
            <Section delay={1} className="relative pl-16 md:pl-28">
              <span className="font-serif text-[clamp(80px,12vw,160px)] leading-none text-white/4 absolute -top-8 -left-4 select-none">01</span>
              <div className="relative z-10">
                <h3 className="font-serif text-3xl md:text-4xl text-white mb-4">Ingesta</h3>
                <p className="text-white/40 max-w-md leading-relaxed text-lg">
                  Pegas tus posts, tweets, newsletters. El sistema extrae tu tono, ritmo, vocabulario y temas recurrentes. No importa el formato.
                </p>
              </div>
            </Section>

            <Section delay={2} className="relative pl-16 md:pl-28">
              <span className="font-serif text-[clamp(80px,12vw,160px)] leading-none text-white/4 absolute -top-8 -left-4 select-none">02</span>
              <div className="relative z-10">
                <h3 className="font-serif text-3xl md:text-4xl text-white mb-4">Genera</h3>
                <p className="text-white/40 max-w-md leading-relaxed text-lg">
                  Escribis un tema y elegis la plataforma. El sistema genera tres versiones distintas, cada una con tu voz, adaptada al formato que necesitas.
                </p>
              </div>
            </Section>

            <Section delay={3} className="relative pl-16 md:pl-28">
              <span className="font-serif text-[clamp(80px,12vw,160px)] leading-none text-white/4 absolute -top-8 -left-4 select-none">03</span>
              <div className="relative z-10">
                <h3 className="font-serif text-3xl md:text-4xl text-white mb-4">Refina</h3>
                <p className="text-white/40 max-w-md leading-relaxed text-lg">
                  Aprobas, rechazas o corregis. Cada decision alimenta la memoria. La proxima vez, acierta de entrada.
                </p>
              </div>
            </Section>
          </div>
        </div>
      </section>

      {/* FREE TOOL */}
      <section id="tool" className="py-32 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <Section delay={0}>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-4">Herramienta gratuita</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-4">Descubri tu voz</h2>
            <p className="text-white/40 mb-16 text-lg max-w-lg">
              Analiza tu tono, estilo y temas en segundos. Sin registro.
            </p>
          </Section>
          <Section delay={2}>
            <VoiceToolSection />
          </Section>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <Section delay={0}>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-4">Comparativa</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-16">Ghostwriter vs el resto.</h2>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-8 border-b md:border-b-0 md:border-r border-white/5">
              <h3 className="text-sm font-medium text-[#E8834A] mb-8">Ghostwriter</h3>
              <ul className="space-y-5">
                {["Memoria de voz persistente", "Loop de feedback con correcciones", "Adaptacion nativa por plataforma", "Perfil de voz unico", "Sin prompts genericos", "Privacidad total"].map((f, i) => (
                  <li key={i} className="text-white/70 text-sm flex items-start gap-3">
                    <span className="text-[#E8834A] mt-0.5">?</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-8">
              <h3 className="text-sm font-medium text-white/30 mb-8">Otros</h3>
              <ul className="space-y-5">
                {["Sin memoria entre sesiones", "Sin aprendizaje de correcciones", "Formato unico para todas", "Prompts genericos", "Copy de IA detectable", "Datos en servidores compartidos"].map((f, i) => (
                  <li key={i} className="text-white/25 text-sm flex items-start gap-3">
                    <span className="mt-0.5">?</span>
                    {f}
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
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-4">Precios</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-16">Simple. Sin sorpresas.</h2>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            <Section delay={1}>
              <div className="bento-card p-10 h-full">
                <h3 className="text-lg font-medium text-white mb-2">Gratis</h3>
                <p className="text-white/30 text-sm mb-8">Para probar la voz</p>
                <div className="font-serif text-5xl text-white mb-8">$0<span className="text-base text-white/30">/mes</span></div>
                <ul className="space-y-3 text-white/40 text-sm">
                  <li>Analisis de voz</li>
                  <li>3 drafts de prueba</li>
                  <li>1 plataforma</li>
                </ul>
              </div>
            </Section>

            <Section delay={2}>
              <div className="bg-[#E8834A] rounded-3xl p-10 h-full">
                <h3 className="text-lg font-medium text-[#0A0A0A] mb-2">Pro</h3>
                <p className="text-[#0A0A0A]/50 text-sm mb-8">Para creadores serios</p>
                <div className="font-serif text-5xl text-[#0A0A0A] mb-8">$29<span className="text-base text-[#0A0A0A]/50">/mes</span></div>
                <ul className="space-y-3 text-[#0A0A0A]/70 text-sm">
                  <li>Memoria ilimitada</li>
                  <li>Multiplataforma</li>
                  <li>Loop de feedback completo</li>
                  <li>Exportar drafts</li>
                  <li>Soporte prioritario</li>
                </ul>
              </div>
            </Section>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="py-48 px-6 border-t border-white/5 relative">
        <ParallaxLayer speed={0.1} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
          <MorphingBlob size={800} opacity={0.03} />
        </ParallaxLayer>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Section delay={0}>
            <p className="font-serif text-3xl md:text-5xl lg:text-6xl text-white italic leading-tight">
              "La IA no deberia sonar a IA.<br />Deberia sonar a vos."
            </p>
          </Section>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="font-serif text-xl text-white">GW</span>
          <div className="flex gap-8 text-sm text-white/30">
            <a href="#" className="line-link hover:text-white/60 transition-colors">Twitter</a>
            <a href="#" className="line-link hover:text-white/60 transition-colors">GitHub</a>
            <a href="#" className="line-link hover:text-white/60 transition-colors">Contacto</a>
          </div>
          <span className="text-xs text-white/15">2025 Ghostwriter</span>
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
      <div className="relative">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Pega aca 3 posts tuyos..."
          className="w-full h-48 bg-transparent border border-white/10 rounded-2xl p-6 text-white/80 placeholder:text-white/15 focus:border-[#E8834A]/40 focus:outline-none resize-none text-base leading-relaxed transition-colors"
        />
      </div>
      <MagneticButton
        onClick={analyze}
        className="bg-[#E8834A] text-[#0A0A0A] px-8 py-3 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 hover:shadow-[0_0_30px_rgba(232,131,74,0.3)] disabled:opacity-40"
      >
        {loading ? "Analizando..." : "Descubri tu voz"}
      </MagneticButton>
      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-slide-up">
          {[
            { label: "Tono", val: result.tone },
            { label: "Estilo", val: result.style },
            { label: "Temas", val: result.topics },
            { label: "Hook", val: `"${result.hook}"` },
          ].map((r, i) => (
            <div key={i} className="bento-card p-6">
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/20 block mb-3">{r.label}</span>
              <p className="text-white/80 font-serif text-xl">{r.val}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
