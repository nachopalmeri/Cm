"use client";

import { useState, useEffect, useRef } from "react";

/* ─── Data ─────────────────────────────────────────────────────────────── */
const agents = [
  {
    name: "Research",
    icon: "◎",
    color: "from-cyan-500/20 to-cyan-600/5",
    border: "border-cyan-500/20",
    glow: "rgba(6,182,212,0.15)",
    copy: "Detecta señales del mercado, tendencias y ángulos antes de escribir.",
  },
  {
    name: "Voice",
    icon: "◈",
    color: "from-violet-500/20 to-violet-600/5",
    border: "border-violet-500/20",
    glow: "rgba(124,58,237,0.15)",
    copy: "Convierte contexto en contenido con tu tono, ritmo y vocabulario.",
  },
  {
    name: "Editor",
    icon: "◉",
    color: "from-purple-500/20 to-purple-600/5",
    border: "border-purple-500/20",
    glow: "rgba(168,85,247,0.15)",
    copy: "Audita cada draft contra tu Brand Brain y elimina AI slop.",
  },
  {
    name: "Distributor",
    icon: "◐",
    color: "from-orange-500/20 to-orange-600/5",
    border: "border-orange-500/20",
    glow: "rgba(249,115,22,0.15)",
    copy: "Adapta el mismo vibe a X, LinkedIn, newsletter y TikTok scripts.",
  },
];

const phases = [
  { n: "01", label: "Pegás tu URL, posts o audios." },
  { n: "02", label: "Ghostwriter extrae tu ADN narrativo." },
  { n: "03", label: "Se crea tu Brand Brain vivo." },
  { n: "04", label: "Los agentes ejecutan contenido multicanal." },
  { n: "05", label: "Cada corrección entrena el sistema." },
];

const comparisons = [
  ["Chatbot", "Responde cuando le pedís algo", "Agentic System", "Planifica, escribe, audita y prepara distribución"],
  ["Prompt", "Se pierde al cerrar la sesión", "Brand Brain", "Memoria viva que compone valor con cada corrección"],
  ["Texto", "Un output aislado", "Content OS", "Un sistema de piezas adaptadas por canal"],
];

const faqs = [
  { q: "¿Es solo un generador de posts con IA?", a: "No. Ghostwriter es un sistema agéntico que captura tu voz, la memoriza y coordina sub-agentes para ejecutar contenido multicanal. No es un chatbot." },
  { q: "¿Mis datos entrenan modelos públicos?", a: "No. Tu Brand Brain es privado y aislado. Solo vos y tu equipo de confianza acceden a tu voz entrenada." },
  { q: "¿Puedo aprobar todo antes de publicar?", a: "Sí. Approval-first es el default. Nada se publica sin tu OK. Podés configurar autonomía progresiva por canal y tipo de contenido." },
  { q: "¿Cuánto tarda el onboarding?", a: "Menos de 3 minutos. Pegás tu contenido existente, elegís tu vibe y el sistema genera tu Brand Brain inicial. Cada corrección lo mejora." },
  { q: "¿Funciona para equipos o solo founders?", a: "Ambos. El Founder plan es para personal brands. El Brand System plan gestiona múltiples voces de marca. Enterprise incluye white-label." },
];

/* ─── Particle background ────────────────────────────────────────────────── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${p.opacity})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

/* ─── Navbar ──────────────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(6,6,8,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}
    >
      <div className="flex items-center gap-2">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
          <span className="text-white text-sm font-bold">G</span>
          <div className="absolute inset-0 rounded-lg" style={{ boxShadow: "0 0 20px rgba(124,58,237,0.5)" }} />
        </div>
        <span className="font-display font-bold text-white tracking-tight">Ghostwriter</span>
        <span className="badge badge-purple hidden sm:flex">v0.6</span>
      </div>
      <div className="hidden items-center gap-8 md:flex">
        {["Brand Brain", "Agents", "Pricing"].map(item => (
          <a key={item} href={`#${item.toLowerCase().replace(" ", "")}`}
            className="text-sm text-white/60 transition hover:text-white">
            {item}
          </a>
        ))}
      </div>
      <a href="/dashboard" className="btn-primary text-sm px-5 py-2.5">
        Abrir app →
      </a>
    </nav>
  );
}

/* ─── Hero ─────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden px-6 pt-24 pb-16">
      {/* Grid bg */}
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Orbs */}
      <div className="absolute left-1/4 top-1/4 orb-purple animate-float" style={{ animationDelay: "0s" }} />
      <div className="absolute right-1/4 bottom-1/3 orb-cyan animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute right-1/3 top-1/3 orb-orange animate-float" style={{ animationDelay: "4s" }} />

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left */}
          <div className="animate-slide-up">
            <div className="mb-6 flex items-center gap-3">
              <span className="badge badge-purple">Agentic Brand System</span>
              <span className="badge badge-cyan">↑ 120x más rápido</span>
            </div>
            <h1 className="font-display text-6xl font-bold leading-[1.05] tracking-tight text-white sm:text-7xl xl:text-8xl">
              Tu voz.<br />
              <span className="gradient-text">Ejecutada</span><br />
              por agentes.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-white/50">
              Ghostwriter no es un chatbot. Es el sistema operativo de tu marca personal: captura tu Brand Brain, coordina sub-agentes y convierte ideas en presencia global con aprobación humana.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a href="#onboarding" className="btn-primary text-base px-7 py-3.5">
                Crear mi Brand Brain
              </a>
              <a href="#agents" className="btn-ghost text-base px-7 py-3.5">
                Ver sistema de agentes
              </a>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center gap-6">
              {[
                { icon: "⬡", text: "Memoria persistente" },
                { icon: "◈", text: "4 agentes coordinados" },
                { icon: "◎", text: "Approval-first" },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2 text-sm text-white/40">
                  <span className="text-brand-400">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Live Brand Brain card */}
          <div className="animate-slide-up relative" style={{ animationDelay: "0.15s" }}>
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-3xl" style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)" }} />

            <div className="glass-card relative overflow-hidden rounded-3xl p-1">
              {/* Header bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-white/30 font-mono">brand-brain / live</span>
                </div>
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
                  </span>
                  live
                </span>
              </div>

              <div className="space-y-2 p-4">
                {[
                  { label: "Voice Match Score", value: "94%", tag: "↑ +2% esta semana", color: "text-green-400" },
                  { label: "Regla aprendida", value: "Evitar buzzwords genéricos de IA", tag: "extracción automática", color: "text-cyan-400" },
                  { label: "Canales activos", value: "X · LinkedIn · Substack · TikTok", tag: "4/4 online", color: "text-violet-400" },
                  { label: "Editor Agent", value: "Sin AI slop detectado — aprobado", tag: "última auditoría", color: "text-brand-400" },
                  { label: "Drafts generados", value: "24 esta semana", tag: "18 aprobados, 3 en revisión", color: "text-orange-400" },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 rounded-xl p-3 transition-all duration-300 hover:bg-white/5"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className={`mt-0.5 text-xs font-bold ${item.color}`}>◆</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">{item.label}</p>
                      <p className="mt-0.5 text-sm font-medium text-white/80">{item.value}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-medium ${item.color} opacity-70`}>{item.tag}</span>
                  </div>
                ))}
              </div>

              {/* Bottom shimmer line */}
              <div className="h-px mx-4 mb-4 animate-shimmer rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats bar ─────────────────────────────────────────────────────────── */
function Stats() {
  const stats = [
    { n: "120x", label: "más rápido que redacción manual" },
    { n: "60s", label: "de idea a draft aprobado" },
    { n: "94%", label: "voice match promedio" },
    { n: "∞", label: "memoria que compone valor" },
  ];
  return (
    <section className="relative px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.n} className="stat-card text-center" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="font-display text-4xl font-bold gradient-text-purple">{s.n}</div>
              <p className="mt-2 text-xs text-white/40 leading-5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Marquee ────────────────────────────────────────────────────────────── */
function Marquee() {
  const items = ["Memoria persistente", "Feedback loop real", "Drafts en segundos", "Aprobás vos, siempre", "X", "LinkedIn", "Substack", "TikTok", "Voice Agent", "Brand Brain", "Zero AI slop", "120x más rápido"];
  return (
    <div className="relative overflow-hidden border-y border-white/5 py-4" style={{ background: "rgba(124,58,237,0.04)" }}>
      <div className="flex animate-marquee whitespace-nowrap">
        {Array.from({ length: 4 }).flatMap((_, j) =>
          items.map((item, i) => (
            <span key={`${j}-${i}`} className="mx-8 text-xs font-semibold uppercase tracking-widest text-white/30">
              <span className="mr-8 text-brand-500">◆</span>{item}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Brand Brain section ───────────────────────────────────────────────── */
function BrandBrainSection() {
  const features = [
    { icon: "◈", title: "Contexto histórico", desc: "Tus posts, audios y URLs alimentan una memoria que no se borra entre sesiones.", color: "text-cyan-400" },
    { icon: "◉", title: "Reglas de voz", desc: "El sistema extrae tu tono, vocabulario, frases prohibidas y estructuras preferidas.", color: "text-violet-400" },
    { icon: "◐", title: "Correcciones persistentes", desc: "Cada edición genera una regla. El próximo draft ya la incorpora sin repetir nada.", color: "text-orange-400" },
  ];
  return (
    <section id="brandbrain" className="relative px-6 py-28">
      <div className="absolute inset-0">
        <div className="absolute left-0 top-1/2 orb-purple opacity-30" style={{ transform: "translateY(-50%)" }} />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-16 grid gap-8 lg:grid-cols-2">
          <div>
            <span className="badge badge-purple mb-4">The asset</span>
            <h2 className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
              El Brand Brain<br />reemplaza al prompt.
            </h2>
          </div>
          <p className="self-end text-lg leading-8 text-white/50 lg:text-xl">
            Cada post, audio, URL y corrección entrena un activo digital permanente. No pedís contenido desde cero: activás un cerebro de marca que recuerda cómo hablás, qué evitás y qué estilo convierte.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="glass-card p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className={f.color}>{f.icon}</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/50">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Agents section ─────────────────────────────────────────────────────── */
function AgentsSection() {
  return (
    <section id="agents" className="relative px-6 py-28">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute right-0 top-1/4 orb-cyan opacity-25" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-16">
          <span className="badge badge-cyan mb-4">Execution layer</span>
          <h2 className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
            No conversa.<br />
            <span className="gradient-text">Coordina trabajo.</span>
          </h2>
        </div>

        {/* Pipeline visual */}
        <div className="mb-12 hidden items-center justify-center gap-0 md:flex">
          {agents.map((a, i) => (
            <div key={a.name} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${a.color} border ${a.border} text-xl`}
                  style={{ boxShadow: `0 0 20px ${a.glow}` }}>
                  <span className="text-white/80">{a.icon}</span>
                </div>
                <span className="text-xs font-semibold text-white/40">{a.name}</span>
              </div>
              {i < agents.length - 1 && (
                <div className="mx-3 h-px w-12 bg-gradient-to-r from-white/20 to-white/5" />
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {agents.map((a) => (
            <div key={a.name} className="glass-card p-6 group">
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${a.color} border ${a.border} text-lg transition-transform group-hover:scale-110`}
                style={{ boxShadow: `0 0 20px ${a.glow}` }}>
                <span className="text-white">{a.icon}</span>
              </div>
              <h3 className="font-display text-base font-semibold text-white">{a.name} Agent</h3>
              <p className="mt-2 text-sm leading-6 text-white/45">{a.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Onboarding section ─────────────────────────────────────────────────── */
function OnboardingSection() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % phases.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="onboarding" className="relative px-6 py-28">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 orb-orange opacity-20" style={{ transform: "translate(-50%,-50%)" }} />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-16">
          <span className="badge badge-orange mb-4">Onboarding en 3 minutos</span>
          <h2 className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
            De cero a<br />
            <span className="gradient-text">clon operativo.</span>
          </h2>
        </div>
        <div className="grid gap-10 lg:grid-cols-2 items-start">
          {/* Steps */}
          <div className="space-y-3">
            {phases.map((p, i) => (
              <button
                key={p.n}
                onClick={() => setActive(i)}
                className="w-full flex items-center gap-5 rounded-2xl p-5 text-left transition-all duration-300"
                style={{
                  background: active === i ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.03)",
                  border: active === i ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: active === i ? "0 0 30px rgba(124,58,237,0.1)" : "none",
                }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold font-mono"
                  style={{
                    background: active === i ? "linear-gradient(135deg, #7c3aed, #06b6d4)" : "rgba(255,255,255,0.06)",
                    color: active === i ? "white" : "rgba(255,255,255,0.3)",
                  }}>
                  {p.n}
                </div>
                <p className={`text-sm leading-6 transition-colors ${active === i ? "text-white" : "text-white/40"}`}>
                  {p.label}
                </p>
                {active === i && (
                  <span className="ml-auto shrink-0 text-brand-400">→</span>
                )}
              </button>
            ))}
          </div>

          {/* Brain builder card */}
          <div className="glass-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-white/60">Brand Brain Builder</span>
              <span className="badge badge-green">online</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/30">
                  Tu contenido existente
                </label>
                <textarea
                  rows={4}
                  placeholder="Pegá tus posts, bio o estilo preferido de escritura..."
                  className="w-full rounded-xl p-4 text-sm text-white/70 placeholder-white/20 resize-none focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/30">
                  Tu vibe
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Founder directo", "Técnico accesible", "Storyteller", "Educativo", "Opinático"].map(v => (
                    <button key={v} className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/50 transition hover:bg-white/8 hover:text-white/80"
                      style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <button className="btn-primary w-full py-3">
                Crear mi Brand Brain →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Comparison section ─────────────────────────────────────────────────── */
function ComparisonSection() {
  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16">
          <span className="badge badge-purple mb-4">Category shift</span>
          <h2 className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl max-w-4xl">
            La redacción manual es el viejo CRM de la marca personal.
          </h2>
        </div>
        <div className="space-y-4">
          {comparisons.map(([oldLabel, oldCopy, newLabel, newCopy]) => (
            <div key={oldLabel} className="grid gap-1 md:grid-cols-2">
              <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">{oldLabel}</p>
                <p className="text-sm leading-7 text-white/40">{oldCopy}</p>
              </div>
              <div className="rounded-2xl p-6" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-400">{newLabel}</p>
                <p className="text-sm leading-7 text-white/70">{newCopy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ────────────────────────────────────────────────────────────── */
function Pricing() {
  const plans = [
    {
      name: "Founder",
      price: "$499",
      period: "/mes",
      desc: "Para personal brands de founders que quieren escalar su voz.",
      features: ["1 voz entrenada", "3 plataformas", "20 drafts/semana", "Approval-first", "Brand Brain básico"],
      cta: "Empezar",
      featured: false,
    },
    {
      name: "Brand System",
      price: "$2,499",
      period: "/mes",
      desc: "Para startups y empresas que gestionan múltiples voces de marca.",
      features: ["5 voces entrenadas", "Todas las plataformas", "Drafts ilimitados", "API access", "Team collaboration", "Analytics básico"],
      cta: "Solicitar demo",
      featured: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      desc: "Para agencias premium y marcas globales con white-label.",
      features: ["Voces ilimitadas", "White-label", "SSO + SLA 99.9%", "CSM dedicado", "Custom integrations"],
      cta: "Contactar ventas",
      featured: false,
    },
  ];
  return (
    <section id="pricing" className="relative px-6 py-28">
      <div className="absolute inset-0 grid-pattern opacity-15" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-16">
          <span className="badge badge-cyan mb-4">Pricing</span>
          <h2 className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Contratá tu Voice Agent.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="glass-card relative flex flex-col p-8"
              style={plan.featured ? { border: "1px solid rgba(124,58,237,0.4)", boxShadow: "0 0 60px rgba(124,58,237,0.12)" } : {}}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge badge-purple px-4">RECOMENDADO</span>
                </div>
              )}
              <div>
                <p className="font-display text-sm font-semibold text-white/50">{plan.name}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/40">{plan.period}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/40">{plan.desc}</p>
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/60">
                    <span className="text-brand-400 text-xs">◆</span>{f}
                  </li>
                ))}
              </ul>
              <button
                className="mt-8 w-full rounded-2xl py-3 font-semibold text-sm transition-all duration-200"
                style={plan.featured ? {
                  background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                  color: "white",
                  boxShadow: "0 8px 30px rgba(124,58,237,0.3)",
                } : {
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonial ────────────────────────────────────────────────────────── */
function Testimonial() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="glass-card relative overflow-hidden p-10 md:p-16 text-center"
          style={{ border: "1px solid rgba(124,58,237,0.2)", boxShadow: "0 0 80px rgba(124,58,237,0.08)" }}>
          <div className="absolute inset-0 grid-pattern opacity-10" />
          <div className="relative z-10">
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-3xl text-3xl text-brand-400/50"
              style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
              ❝
            </div>
            <blockquote className="font-display mx-auto max-w-3xl text-2xl font-medium leading-9 text-white md:text-3xl">
              "Ghostwriter nos devolvió 20 horas semanales. La coherencia entre LinkedIn y newsletter mejoró un 300%. No es un generador de texto, es un miembro del equipo."
            </blockquote>
            <div className="mt-10 flex items-center justify-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl font-bold text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                MC
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Mariana Costa</p>
                <p className="text-xs text-white/40">CEO, PiscuLabs · Founder agresivo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ────────────────────────────────────────────────────────────────── */
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <span className="badge badge-purple mb-6">FAQ</span>
        <h2 className="font-display mb-12 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Preguntas que importan.
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: open === i ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.03)",
                border: open === i ? "1px solid rgba(124,58,237,0.25)" : "1px solid rgba(255,255,255,0.07)",
              }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <span className="text-sm font-medium text-white/80">{faq.q}</span>
                <span
                  className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm transition-all duration-300"
                  style={{
                    background: open === i ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.07)",
                    color: open === i ? "#a78bfa" : "rgba(255,255,255,0.4)",
                    transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
                  }}
                >
                  +
                </span>
              </button>
              <div style={{ maxHeight: open === i ? "200px" : "0", overflow: "hidden", transition: "max-height 0.4s ease, opacity 0.3s ease", opacity: open === i ? 1 : 0 }}>
                <p className="px-6 pb-5 text-sm leading-7 text-white/50">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ──────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-4xl relative"
        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(6,182,212,0.1) 50%, rgba(249,115,22,0.05) 100%)", border: "1px solid rgba(124,58,237,0.25)", boxShadow: "0 0 100px rgba(124,58,237,0.15)" }}>
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute left-0 top-0 orb-purple opacity-30 scale-75" />
        <div className="absolute right-0 bottom-0 orb-cyan opacity-20 scale-50" />
        <div className="relative z-10 p-10 text-center md:p-20">
          <span className="badge badge-purple mb-6">Global Day Zero</span>
          <h2 className="font-display mx-auto max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Tu voz puede estar en todas partes sin que vos estés escribiendo.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/50">
            El producto no promete crecer por magia. Promete construir infraestructura: memoria, control, velocidad y consistencia para competir globalmente.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href="#onboarding" className="btn-primary text-base px-8 py-4">
              Construir mi Voice Agent →
            </a>
            <a href="/dashboard" className="btn-ghost text-base px-8 py-4">
              Abrir dashboard
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t px-6 py-12" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-3">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
            <span className="text-white text-xs font-bold">G</span>
          </div>
          <span className="font-display font-bold text-white">Ghostwriter</span>
          <span className="text-xs text-white/25">Agentic Brand System</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-white/30">
          {["Brand Brain", "Agents", "Pricing", "ROI"].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(" ", "")}`}
              className="transition hover:text-white/70">{item}</a>
          ))}
        </div>
        <p className="text-xs text-white/20">© 2025 PiscuLabs</p>
      </div>
    </footer>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "#060608" }}>
      <ParticleField />
      <Navbar />
      <Hero />
      <Marquee />
      <Stats />
      <BrandBrainSection />
      <AgentsSection />
      <OnboardingSection />
      <ComparisonSection />
      <Pricing />
      <Testimonial />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
