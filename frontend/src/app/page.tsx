"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/Navbar";

type PipelineStatus = "queued" | "running" | "done";
type ApprovalState = "pending" | "approved" | "changes";
type IndustryKey = "creator" | "saas" | "agency";

type Channel = {
  key: "x" | "linkedin" | "substack" | "tiktok";
  title: string;
  output: string;
  draft: string;
  metric: string;
};

const PIPELINE = [
  {
    id: "01",
    name: "Ingesta",
    desc: "Importa posts, hilos y newsletters. Detecta tono, ritmo y vocabulario propio.",
  },
  {
    id: "02",
    name: "Strategist",
    desc: "Convierte el brief en ángulos editoriales con hipótesis de impacto por canal.",
  },
  {
    id: "03",
    name: "Writer",
    desc: "Genera variantes nativas para X, LinkedIn, Substack y video short-form.",
  },
  {
    id: "04",
    name: "Editor",
    desc: "Limpia ruido, corrige estilo y fuerza consistencia con la voz aprendida.",
  },
  {
    id: "05",
    name: "Aprobación",
    desc: "Human-in-the-loop por Telegram: aprobar, rechazar o ajustar con contexto.",
  },
  {
    id: "06",
    name: "Memoria",
    desc: "Cada decisión se convierte en reglas. La siguiente salida llega más cerca.",
  },
] as const;

const INDUSTRIES: Record<
  IndustryKey,
  {
    label: string;
    briefTitle: string;
    briefBody: string;
  }
> = {
  creator: {
    label: "Creator",
    briefTitle: "Workshop founders Argentina",
    briefBody:
      "Objetivo: posicionar autoridad y convertir audiencia en registro del workshop semanal.",
  },
  saas: {
    label: "SaaS B2B",
    briefTitle: "Lanzamiento feature para equipos de producto",
    briefBody:
      "Objetivo: generar demos calificadas y explicar valor técnico sin caer en marketing vacío.",
  },
  agency: {
    label: "Agencia",
    briefTitle: "Oferta de contenido para marcas DTC",
    briefBody:
      "Objetivo: captación de leads premium mostrando proceso y casos con resultados concretos.",
  },
};

const INDUSTRY_CHANNELS: Record<IndustryKey, readonly Channel[]> = {
  creator: [
    {
      key: "x",
      title: "X Thread",
      output: "Hook fuerte, ritmo corto, cierre accionable.",
      draft:
        "Si tu contenido depende de inspiración, no tenés sistema. Te muestro el pipeline que uso para publicar sin forzar la voz.",
      metric: "+27% apertura",
    },
    {
      key: "linkedin",
      title: "LinkedIn",
      output: "Story + insight + take práctico en formato profesional.",
      draft:
        "Pasé de escribir por impulso a operar un sistema editorial. Brief, agentes, aprobación y memoria: menos fricción, más consistencia.",
      metric: "+41% guardados",
    },
    {
      key: "substack",
      title: "Substack",
      output: "Piezas largas con tesis, estructura y call-to-think.",
      draft:
        "Esta edición no va de productividad. Va de arquitectura editorial: cómo convertir correcciones en aprendizaje reutilizable.",
      metric: "+19% lectura completa",
    },
    {
      key: "tiktok",
      title: "TikTok Pack",
      output: "Guion + hooks + secuencia visual para short video.",
      draft:
        "Hook: 'Dejá de empezar de cero'. Secuencia de 5 escenas: dolor, sistema, ejemplo, prueba y CTA.",
      metric: "+33% retención inicial",
    },
  ],
  saas: [
    {
      key: "x",
      title: "X Thread",
      output: "Perspectiva de producto con evidencia técnica.",
      draft:
        "Lanzar features no alcanza: necesitás comunicar problema, trade-off y impacto. Este hilo resume cómo lo operamos por sprint.",
      metric: "+24% clicks a docs",
    },
    {
      key: "linkedin",
      title: "LinkedIn",
      output: "Narrativa B2B con caso y decisión de negocio.",
      draft:
        "Publicamos menos promesas y más operación: qué cambiamos en onboarding, qué medimos y qué mejoró en conversión a demo.",
      metric: "+36% leads MQL",
    },
    {
      key: "substack",
      title: "Substack",
      output: "Deep dive con enfoque product + GTM.",
      draft:
        "Documento de lanzamiento: hipótesis inicial, experimentos de messaging y resultados de las primeras dos semanas.",
      metric: "+22% replies cualitativos",
    },
    {
      key: "tiktok",
      title: "TikTok Pack",
      output: "Resumen visual de valor en menos de 45s.",
      draft:
        "Escena 1: problema. Escena 2: fricción actual. Escena 3: nuevo flujo. Escena 4: impacto. Escena 5: CTA demo.",
      metric: "+29% completion rate",
    },
  ],
  agency: [
    {
      key: "x",
      title: "X Thread",
      output: "Opinión de industria con ejemplos aplicables.",
      draft:
        "La mayoría de marcas no necesita más ideas, necesita mejor sistema de ejecución. Acá va nuestro framework operativo.",
      metric: "+31% engagement",
    },
    {
      key: "linkedin",
      title: "LinkedIn",
      output: "Caso comercial con foco en resultados.",
      draft:
        "Antes: piezas aisladas. Después: pipeline semanal con aprobación y memoria. Resultado: más consistencia y más reuniones de venta.",
      metric: "+38% inbound meetings",
    },
    {
      key: "substack",
      title: "Substack",
      output: "Análisis de estrategia y ejecución para clientes.",
      draft:
        "Cómo diseñamos un sistema de contenido para una marca DTC: from brief to approved assets en 72 horas.",
      metric: "+26% tiempo de lectura",
    },
    {
      key: "tiktok",
      title: "TikTok Pack",
      output: "Formato rápido para captar atención comercial.",
      draft:
        "Narrativa de 5 beats para oferta de agencia: dolor, método, mini caso, prueba social y siguiente paso.",
      metric: "+34% retención 3s",
    },
  ],
};

const INDUSTRY_EVENTS: Record<IndustryKey, readonly string[]> = {
  creator: [
    "> ingest: 12 piezas históricas indexadas",
    "> strategist: detectado ángulo 'operar > improvisar'",
    "> writer: 4 versiones por canal generadas",
    "> editor: reduzco adjetivos y subo especificidad",
    "> telegram: solicitud de aprobación enviada",
    "> memory: nueva regla aplicada a aperturas",
  ],
  saas: [
    "> ingest: changelog + docs + sales calls importados",
    "> strategist: hipótesis principal 'menos fricción en onboarding'",
    "> writer: assets para launch week listos",
    "> editor: refuerzo evidencia y números reales",
    "> telegram: PM validó claims sensibles",
    "> memory: regla nueva 'sin promesas sin métrica'",
  ],
  agency: [
    "> ingest: 8 casos y 20 guiones archivados",
    "> strategist: priorizado mensaje 'sistema que vende'",
    "> writer: lote semanal multiformato generado",
    "> editor: ajusto tono a ICP e industria",
    "> telegram: director creativo pidió cambios en opener",
    "> memory: regla nueva 'caso real en bloque 1'",
  ],
};

const INDUSTRY_DIFFS: Record<
  IndustryKey,
  {
    before: string;
    after: string;
    rule: string;
  }
> = {
  creator: {
    before:
      "La IA te puede ayudar muchísimo a crear contenido y potenciar tu presencia online de manera exponencial.",
    after:
      "Si cada semana empezás desde cero, no tenés estrategia: tenés fricción. Operá un pipeline y vas a publicar con tu voz sin perder tiempo.",
    rule: "Regla aprendida: abrir con fricción concreta + contraste operativo.",
  },
  saas: {
    before:
      "Nuestra nueva funcionalidad mejora onboarding y ofrece una experiencia más intuitiva para todo tipo de usuarios.",
    after:
      "Reducimos 32% el tiempo a primer valor eliminando 2 pasos del onboarding. Menos setup, más activación en el día 1.",
    rule: "Regla aprendida: reemplazar claims por números verificables.",
  },
  agency: {
    before:
      "Ayudamos marcas a crecer con contenido estratégico y creativo adaptado a múltiples plataformas digitales.",
    after:
      "En 6 semanas pasamos de publicaciones aisladas a pipeline semanal con 14 piezas aprobadas y +38% reuniones inbound.",
    rule: "Regla aprendida: mostrar transformación + resultado comercial.",
  },
};

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function Section({
  id,
  children,
  className = "",
  delay = 0,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useInView();

  return (
    <section
      id={id}
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </section>
  );
}

function statusFromIndex(
  stepIndex: number,
  activeIndex: number,
): PipelineStatus {
  if (stepIndex < activeIndex) return "done";
  if (stepIndex === activeIndex) return "running";
  return "queued";
}

function approvalTone(state: ApprovalState) {
  if (state === "approved") {
    return "text-[#1b9c5a] border-[#1b9c5a]/25 bg-[#1b9c5a]/10";
  }
  if (state === "changes") {
    return "text-[#7f5af0] border-[#7f5af0]/25 bg-[#7f5af0]/10";
  }
  return "text-[#181512]/60 border-[#181512]/15 bg-white/50";
}

function VoiceLab() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    tone: string;
    style: string;
    anchor: string;
    direction: string;
  }>(null);

  const analyze = () => {
    if (!text.trim() || loading) return;
    setLoading(true);

    setTimeout(() => {
      const words = text.trim().split(/\s+/);
      const sentences = text.split(/[.!?]+/).filter(Boolean);
      const avgSentence = words.length / Math.max(sentences.length, 1);

      const tone =
        avgSentence <= 12
          ? "Directo y con tensión"
          : avgSentence <= 20
            ? "Didáctico y balanceado"
            : "Profundo y argumentativo";

      const style = text.includes("?")
        ? "Apertura por pregunta"
        : text.includes(":")
          ? "Estructura en puntos"
          : "Narrativa conversacional";

      const first = sentences[0]?.trim() ?? "";
      const anchor = first.length > 70 ? `${first.slice(0, 70)}...` : first;

      const direction =
        words.length < 90
          ? "Amplía contexto y agrega un ejemplo concreto"
          : "Recorta 20% y fortalece el cierre accionable";

      setResult({ tone, style, anchor, direction });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="panel p-6 md:p-8 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-3xl text-[#181512]">
          Laboratorio de voz
        </h3>
        <span className="metric-chip">Demo local</span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Pega 2-3 posts tuyos y mira cómo el sistema detecta señales de voz..."
        className="w-full min-h-40 rounded-2xl border border-[#1B1713]/15 bg-white/70 px-4 py-3 text-sm text-[#181512] placeholder:text-[#181512]/45 focus:outline-none focus:border-[#1B1713]/35"
      />

      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-[#181512]/55">
          {text.length} caracteres
        </span>
        <button
          onClick={analyze}
          disabled={loading || !text.trim()}
          className="rounded-full bg-[#181512] text-[#F6F1E8] px-5 py-2.5 text-sm disabled:opacity-40 hover:bg-[#2B251F] transition-colors"
        >
          {loading ? "Analizando..." : "Analizar voz"}
        </button>
      </div>

      {result ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="panel p-4">
            <p className="kicker mb-2">Tono</p>
            <p className="text-[#181512]/90">{result.tone}</p>
          </div>
          <div className="panel p-4">
            <p className="kicker mb-2">Estilo</p>
            <p className="text-[#181512]/90">{result.style}</p>
          </div>
          <div className="panel p-4 sm:col-span-2">
            <p className="kicker mb-2">Frase ancla</p>
            <p className="text-[#181512]/90 italic">
              “{result.anchor || "Sin frase detectada"}”
            </p>
          </div>
          <div className="panel p-4 sm:col-span-2">
            <p className="kicker mb-2">Siguiente mejora</p>
            <p className="text-[#181512]/90">{result.direction}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function Home() {
  const [industry, setIndustry] = useState<IndustryKey>("creator");
  const [activeStep, setActiveStep] = useState(0);
  const [eventCursor, setEventCursor] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [selectedChannel, setSelectedChannel] =
    useState<Channel["key"]>("linkedin");
  const [approvalState, setApprovalState] = useState<ApprovalState>("pending");

  const industryConfig = INDUSTRIES[industry];
  const channels = INDUSTRY_CHANNELS[industry];
  const events = INDUSTRY_EVENTS[industry];
  const memoryDiff = INDUSTRY_DIFFS[industry];

  useEffect(() => {
    setEventCursor(0);
    setApprovalState("pending");
  }, [industry]);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setActiveStep((current) => (current + 1) % PIPELINE.length);
      setEventCursor((current) => (current + 1) % events.length);
    }, 1400);

    return () => clearInterval(timer);
  }, [autoPlay, events.length]);

  const timeline = useMemo(
    () =>
      PIPELINE.map((step, index) => ({
        ...step,
        status: statusFromIndex(index, activeStep),
      })),
    [activeStep],
  );

  const selectedOutput = useMemo(
    () =>
      channels.find((channel) => channel.key === selectedChannel) ??
      channels[0],
    [channels, selectedChannel],
  );

  const progress = ((activeStep + 1) / PIPELINE.length) * 100;

  return (
    <main className="min-h-screen ink-grid">
      <Navbar />

      <section className="px-6 pt-28 pb-16">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.12fr] gap-10 items-start">
          <div className="space-y-7">
            <p className="kicker">Ghostwriter • Content Operating System</p>
            <h1 className="font-serif text-[clamp(42px,8vw,96px)] leading-[0.94] tracking-tight text-[#181512]">
              Tu contenido
              <br />
              funciona mejor
              <br />
              cuando opera.
            </h1>
            <p className="text-[#181512]/72 text-lg max-w-xl leading-relaxed">
              De brief a contenido aprobado: estratega, writer, editor,
              aprobación humana y memoria. Todo en un flujo visible, trazable y
              mejorable.
            </p>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(INDUSTRIES) as IndustryKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setIndustry(key)}
                  className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${
                    industry === key
                      ? "bg-[#181512] text-[#F6F1E8] border-[#181512]"
                      : "bg-white/70 text-[#181512]/75 border-[#181512]/15 hover:bg-white"
                  }`}
                >
                  {INDUSTRIES[key].label}
                </button>
              ))}
            </div>

            <div className="panel p-4">
              <p className="kicker mb-2">Brief activo</p>
              <p className="font-medium text-[#181512]">
                {industryConfig.briefTitle}
              </p>
              <p className="text-sm text-[#181512]/72 mt-1">
                {industryConfig.briefBody}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="#proof"
                className="rounded-full bg-[#181512] text-[#F6F1E8] px-5 py-2.5 text-sm hover:bg-[#2B251F] transition-colors"
              >
                Ver flujo completo
              </a>
              <a
                href="#studio"
                className="rounded-full border border-[#181512]/25 px-5 py-2.5 text-sm text-[#181512] hover:bg-white/50 transition-colors"
              >
                Abrir simulador
              </a>
            </div>
          </div>

          <div className="os-shell p-6 md:p-7 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                  Control room
                </p>
                <p className="text-sm text-white/70">
                  Weekly Brief • {industryConfig.briefTitle}
                </p>
              </div>
              <span className="text-xs text-[#8BE28B]">LIVE</span>
            </div>

            <div className="space-y-3">
              {timeline.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className={`signal-dot ${step.status}`} />
                    <div>
                      <p className="text-sm text-white">{step.name}</p>
                      <p className="text-xs text-white/45">Agent {step.id}</p>
                    </div>
                  </div>
                  <span className="text-xs text-white/55 capitalize">
                    {step.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="progress-track">
                <div
                  className="progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-white/45">
                  stage {activeStep + 1}/{PIPELINE.length}
                </p>
                <button
                  onClick={() => setAutoPlay((current) => !current)}
                  className="text-xs rounded-full border border-white/15 px-2 py-1 text-white/70 hover:text-white"
                >
                  {autoPlay ? "Auto ON" : "Auto OFF"}
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={PIPELINE.length - 1}
                value={activeStep}
                onChange={(e) => {
                  setAutoPlay(false);
                  setActiveStep(Number(e.target.value));
                }}
                className="w-full"
              />
            </div>

            <div className="border-t border-white/10 pt-4 space-y-1 text-xs text-white/70 font-mono">
              {events.map((event, index) => (
                <p
                  key={event}
                  className={`terminal-line ${index === eventCursor ? "active" : ""}`}
                >
                  {event}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section id="studio" className="px-6 py-16">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="max-w-2xl">
            <p className="kicker mb-3">Simulador operativo</p>
            <h2 className="font-serif text-5xl leading-tight text-[#181512]">
              Vista producto en acción
            </h2>
          </div>

          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-4">
            <article className="panel p-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                {channels.map((channel) => (
                  <button
                    key={channel.key}
                    onClick={() => setSelectedChannel(channel.key)}
                    className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${
                      selectedChannel === channel.key
                        ? "bg-[#181512] text-[#F6F1E8] border-[#181512]"
                        : "bg-white/70 text-[#181512]/75 border-[#181512]/15 hover:bg-white"
                    }`}
                  >
                    {channel.title}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-[#181512]/12 bg-white/70 p-4 space-y-3">
                <p className="kicker">Salida seleccionada</p>
                <h3 className="font-serif text-3xl text-[#181512]">
                  {selectedOutput.title}
                </h3>
                <p className="text-sm text-[#181512]/72">
                  {selectedOutput.output}
                </p>
                <p className="text-sm text-[#181512]/88 leading-relaxed">
                  {selectedOutput.draft}
                </p>
                <span className="metric-chip">{selectedOutput.metric}</span>
              </div>
            </article>

            <article className="panel p-5 space-y-4">
              <p className="kicker">Human approval</p>
              <div className="rounded-2xl border border-[#181512]/12 bg-white/70 p-4 space-y-4">
                <p className="text-sm text-[#181512]/78">
                  Estado actual del borrador {selectedOutput.title}
                </p>
                <div
                  className={`inline-flex rounded-full px-3 py-1.5 text-xs border ${approvalTone(approvalState)}`}
                >
                  {approvalState === "pending" && "Pendiente de revisión"}
                  {approvalState === "approved" && "Aprobado para publicar"}
                  {approvalState === "changes" && "Requiere ajustes"}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setApprovalState("approved")}
                    className="rounded-full border border-[#1b9c5a]/30 bg-[#1b9c5a]/10 px-3 py-1.5 text-xs text-[#1b9c5a]"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => setApprovalState("changes")}
                    className="rounded-full border border-[#7f5af0]/30 bg-[#7f5af0]/10 px-3 py-1.5 text-xs text-[#7f5af0]"
                  >
                    Pedir cambios
                  </button>
                  <button
                    onClick={() => setApprovalState("pending")}
                    className="rounded-full border border-[#181512]/20 bg-white px-3 py-1.5 text-xs text-[#181512]/70"
                  >
                    Reset
                  </button>
                </div>

                <div className="rounded-xl border border-[#181512]/12 bg-white p-3">
                  <p className="text-xs text-[#181512]/45 mb-2">
                    Nota al editor
                  </p>
                  <p className="text-sm text-[#181512]/80">
                    “Mantener tensión inicial. Reducir abstracción y cerrar con
                    una acción concreta para el lector.”
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </Section>

      <Section id="engine" className="px-6 py-16" delay={0.08}>
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="max-w-2xl">
            <p className="kicker mb-3">Cómo piensa el sistema</p>
            <h2 className="font-serif text-5xl leading-tight text-[#181512]">
              Pipeline editorial multiagente
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PIPELINE.map((step) => (
              <article key={step.id} className="panel p-5">
                <p className="text-xs tracking-[0.2em] uppercase text-[#181512]/45 mb-2">
                  Agent {step.id}
                </p>
                <h3 className="font-serif text-2xl mb-3 text-[#181512]">
                  {step.name}
                </h3>
                <p className="text-sm text-[#181512]/70 leading-relaxed">
                  {step.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section id="proof" className="px-6 py-16" delay={0.14}>
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="max-w-2xl">
            <p className="kicker mb-3">Evidencia</p>
            <h2 className="font-serif text-5xl leading-tight text-[#181512]">
              Proof-by-flow, no feature dump
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <article className="panel p-5">
              <p className="kicker mb-2">Input</p>
              <p className="text-sm text-[#181512]/70 leading-relaxed">
                {industryConfig.briefBody}
              </p>
            </article>

            <article className="panel p-5">
              <p className="kicker mb-2">Draft v1</p>
              <p className="text-sm text-[#181512]/70 leading-relaxed">
                {selectedOutput.draft}
              </p>
            </article>

            <article className="panel p-5">
              <p className="kicker mb-2">Aprobado + memoria</p>
              <p className="text-sm text-[#181512]/70 leading-relaxed">
                {memoryDiff.rule}
              </p>
            </article>
          </div>
        </div>
      </Section>

      <Section id="memory" className="px-6 py-16" delay={0.2}>
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="max-w-2xl">
            <p className="kicker mb-3">Memoria</p>
            <h2 className="font-serif text-5xl leading-tight text-[#181512]">
              Before / After de aprendizaje
            </h2>
          </div>

          <div className="panel p-5 md:p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#b74c4c]/25 bg-[#b74c4c]/[0.06] p-4">
                <p className="kicker mb-2">Antes</p>
                <p className="text-sm text-[#6d2f2f] leading-relaxed">
                  {memoryDiff.before}
                </p>
              </div>
              <div className="rounded-2xl border border-[#1b9c5a]/25 bg-[#1b9c5a]/[0.07] p-4">
                <p className="kicker mb-2">Después</p>
                <p className="text-sm text-[#186840] leading-relaxed">
                  {memoryDiff.after}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-[#181512]/12 bg-white/70 p-3">
              <p className="text-xs text-[#181512]/55">
                Regla guardada en memoria
              </p>
              <p className="text-sm text-[#181512]/82 mt-1">
                {memoryDiff.rule}
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section id="tool" className="px-6 py-16" delay={0.26}>
        <div className="max-w-4xl mx-auto">
          <VoiceLab />
        </div>
      </Section>

      <section className="px-6 pt-10 pb-20">
        <div className="max-w-6xl mx-auto panel p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="kicker mb-2">Siguiente paso</p>
            <h3 className="font-serif text-4xl text-[#181512] leading-tight">
              Convertí tu contenido en un sistema, no en una tarea.
            </h3>
          </div>
          <a
            href="#"
            className="rounded-full bg-[#181512] text-[#F6F1E8] px-6 py-3 text-sm hover:bg-[#2B251F] transition-colors"
          >
            Solicitar acceso
          </a>
        </div>
      </section>
    </main>
  );
}
