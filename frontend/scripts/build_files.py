"""Generate all frontend source files for the Ghostwriter Next.js app."""
import pathlib, textwrap

BASE = pathlib.Path(__file__).parent.parent
SRC  = BASE / "src"
APP  = SRC / "app"
COMP = SRC / "components"
UI   = COMP / "ui"
LIB  = SRC / "lib"

for d in [APP, APP/"dashboard", COMP, UI, LIB, BASE/"public"]:
    d.mkdir(parents=True, exist_ok=True)

def w(path: pathlib.Path, content: str):
    path.write_text(textwrap.dedent(content).lstrip(), encoding="utf-8")
    print(f"  ✓ {path.relative_to(BASE)}")

# ── tailwind.config.ts ────────────────────────────────────────────────────────
w(BASE / "tailwind.config.ts", """
import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Instrument Serif", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        copper: { DEFAULT: "#E8834A", dark: "#C4622D", light: "#F2A878" },
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "ticker":  "ticker 30s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        ticker: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
""")

# ── src/app/globals.css ───────────────────────────────────────────────────────
w(APP / "globals.css", """
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&display=swap');

:root {
  --bg:      #0C0A09;
  --surface: #1C1917;
  --border:  rgba(255,255,255,0.08);
  --copper:  #E8834A;
  --copper-d:#C4622D;
  --text:    #F5F0EB;
  --muted:   #A8A29E;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

::selection { background: var(--copper); color: #0C0A09; }
""")

# ── src/app/layout.tsx ────────────────────────────────────────────────────────
w(APP / "layout.tsx", """
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ghostwriter — Tu voz. Tu memoria. Cada vez.",
  description:
    "El único ghostwriter AI con memoria persistente. Genera contenido para X, LinkedIn y Substack que suena exactamente como vos. Aprende con cada corrección.",
  openGraph: {
    title: "Ghostwriter AI",
    description: "Contenido que suena como vos. Memoria que mejora con cada draft.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
""")

# ── src/lib/utils.ts ──────────────────────────────────────────────────────────
w(LIB / "utils.ts", """
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
""")

# ── src/lib/api.ts ────────────────────────────────────────────────────────────
w(LIB / "api.ts", """
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface BrandProfile {
  name: string; handle: string; voice: string;
  tone: string; personality: string; style: string;
  audience_description: string; platforms: string[];
}
export interface ContentDraft {
  id: string; text: string; platform: string; topic: string; approved: boolean | null;
}
export interface GenerateResponse { options: ContentDraft[]; }

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" }, ...opts,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  ingest: (texts: string[], source: string, brand: BrandProfile) =>
    apiFetch("/ghostwriter/ingest", { method: "POST", body: JSON.stringify({ texts, source, brand_profile: brand }) }),
  generate: (topic: string, platform: string, count: number, brand: BrandProfile) =>
    apiFetch<GenerateResponse>("/ghostwriter/generate", { method: "POST", body: JSON.stringify({ topic, platform, count, brand_profile: brand }) }),
  feedback: (draft_id: string, draft_text: string, approved: boolean, correction: string | undefined, brand_profile_id: string) =>
    apiFetch("/ghostwriter/feedback", { method: "POST", body: JSON.stringify({ draft_id, draft_text, approved, correction, brand_profile_id }) }),
};
""")

# ── src/components/ui/button.tsx ─────────────────────────────────────────────
w(UI / "button.tsx", """
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium ring-offset-stone-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:  "bg-copper text-stone-950 hover:bg-copper-dark",
        outline:  "border border-white/20 text-stone-100 hover:border-copper hover:text-copper",
        ghost:    "text-stone-400 hover:text-copper hover:bg-white/5",
        link:     "text-copper underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm:      "h-8 px-3 text-xs",
        lg:      "h-12 px-8 text-base",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";
export { Button, buttonVariants };
""")

# ── src/components/Navbar.tsx ─────────────────────────────────────────────────
w(COMP / "Navbar.tsx", """
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-stone-950/90 backdrop-blur-md border-b border-white/8"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-serif text-2xl font-bold tracking-tight text-white">GW</span>
        <div className="flex items-center gap-8">
          <Link href="#how" className="text-sm text-stone-400 hover:text-copper transition-colors">
            Cómo funciona
          </Link>
          <Link href="#pricing" className="text-sm text-stone-400 hover:text-copper transition-colors">
            Precios
          </Link>
          <Button asChild size="sm">
            <Link href="#tool">Probá gratis →</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
""")

# ── src/components/VoiceTool.tsx ──────────────────────────────────────────────
w(COMP / "VoiceTool.tsx", """
"use client";
import { useState } from "react";
import { Button } from "./ui/button";

type VoiceResult = {
  tone: string;
  style: string;
  topics: string[];
  hook: string;
};

function analyzeLocally(text: string): VoiceResult {
  const lower = text.toLowerCase();
  const words = lower.split(/\\s+/);

  const tones: Record<string, string> = {
    "!": "energético, con convicción",
    "?": "inquisitivo, genera debate",
    "creo": "opinionado pero medido",
    "ship": "builder de acción rápida",
    "datos": "data-driven",
  };
  let tone = "directo y claro";
  for (const [k, v] of Object.entries(tones)) {
    if (lower.includes(k)) { tone = v; break; }
  }

  const avgSentLen = words.length / Math.max(1, (text.match(/[.!?]/g) || []).length);
  const style = avgSentLen < 8 ? "frases cortas y contundentes" : avgSentLen < 15 ? "párrafos medianos, equilibrados" : "narrativo, desarrolla ideas";

  const topicMap: Record<string, string> = {
    ai: "Inteligencia Artificial", agente: "AI Agents", startup: "Startups",
    saas: "SaaS", build: "Builders", product: "Producto", "aprender": "Aprendizaje",
    ship: "Shipping", data: "Datos", tech: "Tecnología", lanzar: "Lanzamiento",
  };
  const topics = Object.entries(topicMap)
    .filter(([k]) => lower.includes(k))
    .map(([, v]) => v)
    .slice(0, 5);
  if (topics.length === 0) topics.push("Ideas propias", "Experiencias personales");

  const firstSent = text.split(/[.!?]/)[0]?.trim() || text.substring(0, 60);
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
    setTimeout(() => {
      setResult(analyzeLocally(text));
      setLoading(false);
    }, 900);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium tracking-widest uppercase text-stone-500 mb-3">
          Tus posts (3 a 5 ejemplos, uno por párrafo)
        </label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={7}
          placeholder={"Pegá acá tus tweets o posts...\\n\\nEjemplo:\\nShipiemos el MVP. La perfección es el enemigo del lanzamiento.\\n\\nLos agentes AI sin memoria son solo autocomplete con contexto."}
          className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-stone-200 placeholder:text-stone-600 resize-y focus:outline-none focus:border-copper transition-colors font-sans leading-relaxed"
        />
      </div>

      <Button onClick={analyze} disabled={text.trim().length < 20 || loading} className="w-full" size="lg">
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" />
            Analizando tu voz...
          </span>
        ) : "Analizar mi voz →"}
      </Button>

      {result && (
        <div className="border border-copper/30 bg-copper/5 rounded-sm p-5 space-y-4 animate-fade-in">
          <p className="text-xs font-medium tracking-widest uppercase text-copper">Perfil de voz detectado</p>
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
                  <span key={t} className="text-xs px-2 py-1 bg-copper/15 text-copper border border-copper/25 rounded-sm">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-widest text-stone-500 mb-1">Hook típico tuyo</p>
              <p className="text-sm italic text-stone-400">"{result.hook}"</p>
            </div>
          </div>
          <div className="pt-3 border-t border-white/8">
            <p className="text-sm text-stone-400 mb-3">
              ¿Querés que el ghostwriter genere con esta voz?
            </p>
            <Button asChild size="lg" className="w-full">
              <a href="#pricing">Empezar prueba de 7 días →</a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
""")

# ── src/app/page.tsx ──────────────────────────────────────────────────────────
w(APP / "page.tsx", r"""
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import VoiceTool from "@/components/VoiceTool";
import { Button } from "@/components/ui/button";

/* ── counter hook ────────────────────────────────────────────── */
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

/* ── Stat counter ────────────────────────────────────────────── */
function Stat({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const { count, ref } = useCounter(value);
  return (
    <div ref={ref} className="flex flex-col gap-1">
      <span className="font-serif text-4xl font-bold text-white tabular-nums">
        {count.toLocaleString("es-AR")}{suffix}
      </span>
      <span className="text-xs uppercase tracking-widest text-stone-500">{label}</span>
    </div>
  );
}

/* ── ticker items ────────────────────────────────────────────── */
const TICKER = [
  "Memoria persistente entre sesiones",
  "Feedback loop real que mejora el prompt",
  "Drafts en segundos",
  "Aprobás vos, siempre",
  "X · LinkedIn · Substack · TikTok",
  "Análisis de correcciones automático",
  "Voz que no suena a IA genérica",
  "Sin auto-posting. Sin sorpresas.",
];

/* ── comparison data ──────────────────────────────────────────── */
const COMPARE = [
  { feat: "Genera contenido",        chatgpt: true,  taplio: true,  hyp: false, ours: true  },
  { feat: "Aprende tu voz",          chatgpt: false, taplio: "~",   hyp: false, ours: true  },
  { feat: "Memoria persistente",     chatgpt: false, taplio: false, hyp: false, ours: true  },
  { feat: "Aprende de correcciones", chatgpt: false, taplio: false, hyp: false, ours: true  },
  { feat: "Multi-plataforma",        chatgpt: true,  taplio: "~",   hyp: "~",   ours: true  },
  { feat: "Aprobás vos",             chatgpt: true,  taplio: true,  hyp: "~",   ours: true  },
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true)  return <span className="text-emerald-400 font-bold">✓</span>;
  if (v === false) return <span className="text-stone-600">✗</span>;
  return <span className="text-stone-500">~</span>;
}

/* ── main page ───────────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16">
        {/* bg texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(232,131,74,0.12),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-[1fr_420px] gap-16 items-center">
            {/* left */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-copper/30 bg-copper/8 text-copper text-xs font-medium tracking-widest uppercase mb-8 animate-fade-in">
                <span className="w-1.5 h-1.5 bg-copper rounded-full animate-pulse" />
                Ghostwriter AI · Pisculichi Labs
              </div>

              <h1 className="font-serif text-[clamp(3rem,8vw,6.5rem)] font-bold leading-[0.92] tracking-tight mb-8">
                <span className="block text-white">Tu voz.</span>
                <span className="block text-copper italic">Tu memoria.</span>
                <span className="block text-white">Cada vez.</span>
              </h1>

              <p className="text-stone-400 text-lg leading-relaxed max-w-lg mb-10">
                El único ghostwriter que aprende exactamente cómo escribís vos.
                Con cada corrección que hacés, se vuelve{" "}
                <span className="text-stone-200">más vos</span>.
              </p>

              <div className="flex flex-wrap gap-4 mb-16">
                <Button asChild size="lg">
                  <Link href="#tool">Analizá tu voz — gratis →</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#how">Ver cómo funciona</Link>
                </Button>
              </div>

              <div className="flex items-end gap-10 flex-wrap">
                <Stat value={847}   label="Fundadores activos" />
                <div className="w-px h-10 bg-white/10 self-center hidden sm:block" />
                <Stat value={12400} label="Drafts generados" />
                <div className="w-px h-10 bg-white/10 self-center hidden sm:block" />
                <Stat value={94}    label="Aprobación 1er draft" suffix="%" />
              </div>
            </div>

            {/* right — live preview card */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-b from-copper/20 to-transparent rounded-sm blur-xl" />
                <div className="relative bg-stone-900 border border-white/10 rounded-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-stone-500">Draft generado</span>
                    <span className="text-xs text-copper bg-copper/10 px-2 py-0.5 rounded-sm">X / Twitter</span>
                  </div>
                  <p className="text-stone-200 text-sm leading-relaxed font-sans">
                    "Los agentes AI sin memoria son autocomplete con traje.<br /><br />
                    El 90% de los builders lo ignora hasta que ya es tarde.<br /><br />
                    Yo lo ignoré por 6 meses."
                  </p>
                  <div className="flex gap-2 pt-2 border-t border-white/8">
                    <button className="flex-1 text-xs py-2 bg-copper text-stone-950 font-medium rounded-sm hover:bg-copper-dark transition-colors">
                      ✓ Aprobar
                    </button>
                    <button className="flex-1 text-xs py-2 border border-white/15 text-stone-400 rounded-sm hover:border-white/30 transition-colors">
                      ✕ Rechazar
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs text-stone-600">Memoria activa · 24 entradas guardadas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ────────────────────────────────────────────── */}
      <div className="border-y border-white/8 bg-stone-900 py-3 overflow-hidden">
        <div className="flex gap-0" style={{ width: "max-content", animation: "ticker 40s linear infinite" }}>
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="text-xs uppercase tracking-widest text-stone-500 whitespace-nowrap px-8">
              {i % 2 === 0 ? <span className="text-copper mr-8">◆</span> : null}{t}
            </span>
          ))}
        </div>
      </div>

      {/* ── PROBLEM STATEMENT ─────────────────────────────────── */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-widest text-stone-600 mb-6">El problema real</p>
          <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-bold leading-tight text-stone-200 mb-6">
            Las IAs escriben. Pero no escriben{" "}
            <span className="text-copper italic">como vos</span>.
          </h2>
          <p className="text-stone-500 text-lg leading-relaxed max-w-2xl">
            ChatGPT no recuerda tu voz. Taplio te da templates genéricos. Hypefury solo scheduleá.
            Ninguno aprende de las correcciones que hacés. Cada vez empezás de cero.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section id="how" className="py-24 max-w-6xl mx-auto px-6 scroll-mt-20">
        <p className="text-xs uppercase tracking-widest text-stone-600 mb-4">El proceso</p>
        <h2 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-bold leading-tight mb-20">
          <span className="text-white">Tres pasos.</span>
          <br />
          <span className="text-copper italic">Un solo resultado.</span>
        </h2>

        <div className="space-y-0 border-t border-white/8">
          {[
            {
              num: "01",
              title: "Ingresás tu contenido",
              body: "Pegás tweets, posts, notas — cualquier cosa que hayas escrito vos. El sistema construye tu perfil de voz: tono, ritmo, vocabulario, estructuras típicas.",
              visual: (
                <div className="bg-stone-900 border border-white/8 rounded-sm p-5 font-mono text-xs space-y-2">
                  <div><span className="text-copper">"voice":</span> <span className="text-stone-400">"builder irreverente que shipea rápido"</span></div>
                  <div><span className="text-copper">"tone":</span>  <span className="text-stone-400">"casual, data-driven, sin fluff"</span></div>
                  <div><span className="text-copper">"style":</span> <span className="text-stone-400">"párrafos cortos, hooks con pregunta"</span></div>
                  <div><span className="text-copper">"avoid":</span> <span className="text-stone-400">"buzzwords, frases genéricas"</span></div>
                </div>
              ),
            },
            {
              num: "02",
              title: "Generás drafts",
              body: "Elegís tema y plataforma. Recibís 3 versiones que suenan como vos, no como ChatGPT. Aprobás, rechazás o corregís con una palabra.",
              visual: (
                <div className="bg-stone-900 border border-white/8 rounded-sm p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-600">𝕏 Twitter · Draft 2/3</span>
                    <span className="text-xs text-copper">generado</span>
                  </div>
                  <p className="text-sm text-stone-300 leading-relaxed">
                    "Los agentes AI sin memoria son autocomplete con traje.<br /><br />
                    El 90% de los builders lo ignora hasta que ya es tarde."
                  </p>
                  <div className="flex gap-2">
                    <span className="text-xs px-3 py-1.5 bg-copper text-stone-950 font-medium rounded-sm">✓ Aprobar</span>
                    <span className="text-xs px-3 py-1.5 border border-white/15 text-stone-500 rounded-sm">✕ Rechazar</span>
                  </div>
                </div>
              ),
            },
            {
              num: "03",
              title: "La memoria aprende",
              body: "Cada corrección alimenta el sistema. Las frases que reemplazás, los temas que agregás, la estructura que preferís — todo queda en BrandMemory y el próximo draft es mejor.",
              visual: (
                <div className="bg-stone-900 border border-white/8 rounded-sm p-5 space-y-2.5">
                  {[
                    { ok: true,  txt: "Aprobado — tono directo, hook con pregunta" },
                    { ok: false, txt: 'Corregido — evitar "amazing", agregar datos' },
                    { ok: true,  txt: "Aprobado — estructura: insight + evidencia" },
                    { ok: true,  txt: "Aprobado — párrafos cortos, cierre con CTA" },
                  ].map((e, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${e.ok ? "bg-emerald-400" : "bg-copper"}`} />
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
            <div key={i} className={`grid md:grid-cols-[80px_1fr_1fr] gap-8 py-12 border-b border-white/8 items-start ${i % 2 === 1 ? "md:[direction:rtl]" : ""}`}>
              <div className={i % 2 === 1 ? "md:[direction:ltr]" : ""}>
                <span className="font-serif text-5xl font-bold text-stone-800">{step.num}</span>
              </div>
              <div className={i % 2 === 1 ? "md:[direction:ltr]" : ""}>
                <h3 className="font-serif text-2xl font-bold text-white mb-4">{step.title}</h3>
                <p className="text-stone-400 text-base leading-relaxed">{step.body}</p>
              </div>
              <div className={i % 2 === 1 ? "md:[direction:ltr]" : ""}>{step.visual}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FREE TOOL ─────────────────────────────────────────── */}
      <section id="tool" className="py-24 bg-stone-900 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-start">
            <div>
              <p className="text-xs uppercase tracking-widest text-stone-600 mb-4">Herramienta gratuita</p>
              <h2 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-bold leading-tight mb-6">
                <span className="text-white">Descubrí tu</span>
                <br />
                <span className="text-copper italic">perfil de voz</span>
              </h2>
              <p className="text-stone-400 text-base leading-relaxed">
                Pegá 3 a 5 de tus posts o tweets. El sistema analiza tu tono, estilo y temas recurrentes.
                Gratis, sin registro, en segundos.
              </p>
            </div>
            <VoiceTool />
          </div>
        </div>
      </section>

      {/* ── DIFFERENTIATORS ───────────────────────────────────── */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <p className="text-xs uppercase tracking-widest text-stone-600 mb-4">Por qué funciona</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-white/8">
          {[
            { icon: "⊕", title: "Memoria real entre sesiones", body: "No es un contexto que se borra. Cada aprobación y corrección queda en tu BrandMemory permanentemente.", featured: false },
            { icon: "◈", title: "Feedback loop que mejora el prompt", body: "Cuando corregís un draft, el sistema extrae qué frases reemplazaste y qué temas agregaste. El próximo generate ya los incorpora.", featured: true },
            { icon: "⊘", title: "Aprobás vos. Siempre.", body: "Nada se publica automáticamente. El ghostwriter propone, vos decidís.", featured: false },
            { icon: "⊗", title: "Telegram-native", body: "Usalo con /ghost y /ingest. Sin dashboard obligatorio, sin abrir otra tab.", featured: false },
          ].map((d, i) => (
            <div
              key={i}
              className={`p-8 border-r border-b border-white/8 last:border-r-0 relative ${
                d.featured ? "bg-stone-900" : "hover:bg-white/[0.02] transition-colors"
              }`}
            >
              <div className="text-copper text-2xl mb-5">{d.icon}</div>
              <h3 className={`font-serif text-lg font-bold mb-3 ${d.featured ? "text-white" : "text-stone-200"}`}>{d.title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{d.body}</p>
              {d.featured && (
                <span className="absolute top-6 right-6 text-xs px-2 py-0.5 border border-copper/40 text-copper rounded-sm tracking-widest uppercase">
                  El diferencial
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON ────────────────────────────────────────── */}
      <section className="py-24 bg-stone-900">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs uppercase tracking-widest text-stone-600 mb-4">Comparativa</p>
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-bold leading-tight mb-12">
            <span className="text-white">Todos generan.</span>
            <br />
            <span className="text-copper italic">Solo uno aprende.</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left py-4 pr-8 text-xs uppercase tracking-widest text-stone-600 font-medium">Feature</th>
                  {["ChatGPT", "Taplio", "Hypefury"].map(h => (
                    <th key={h} className="py-4 px-6 text-xs uppercase tracking-widest text-stone-600 font-medium text-center">{h}</th>
                  ))}
                  <th className="py-4 px-6 text-xs uppercase tracking-widest text-copper font-medium text-center bg-copper/5">Ghostwriter</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-4 pr-8 text-stone-300 font-medium">{row.feat}</td>
                    <td className="py-4 px-6 text-center"><Cell v={row.chatgpt} /></td>
                    <td className="py-4 px-6 text-center"><Cell v={row.taplio} /></td>
                    <td className="py-4 px-6 text-center"><Cell v={row.hyp} /></td>
                    <td className="py-4 px-6 text-center bg-copper/5 font-bold text-emerald-400"><Cell v={row.ours} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────── */}
      <section id="pricing" className="py-24 max-w-6xl mx-auto px-6 scroll-mt-20">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-widest text-stone-600 mb-4">Precios</p>
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-bold leading-tight">
            <span className="text-white">Simple.</span>{" "}
            <span className="text-copper italic">Sin sorpresas.</span>
          </h2>
          <p className="text-stone-500 mt-4">7 días gratis. Sin tarjeta de crédito.</p>
        </div>

        <div className="grid md:grid-cols-2 max-w-2xl mx-auto border border-white/8">
          {[
            {
              name: "Starter", price: 19, featured: false,
              features: ["50 drafts por mes", "Voice memory persistente", "X + LinkedIn", "Feedback loop básico", "Telegram bot"],
            },
            {
              name: "Pro", price: 49, featured: true,
              features: ["Drafts ilimitados", "X · LinkedIn · Substack · TikTok", "Feedback loop completo", "Voice profile export", "Soporte prioritario", "Acceso early a nuevas features"],
            },
          ].map((plan, i) => (
            <div key={i} className={`p-8 border-r border-white/8 last:border-r-0 relative ${plan.featured ? "bg-stone-900" : ""}`}>
              {plan.featured && (
                <div className="absolute top-6 right-6 text-xs px-2 py-0.5 border border-copper/40 text-copper rounded-sm tracking-widest uppercase">
                  Más elegido
                </div>
              )}
              <div className={`font-serif text-xl font-bold mb-2 ${plan.featured ? "text-white" : "text-stone-300"}`}>
                {plan.name}
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-serif text-5xl font-bold text-white">${plan.price}</span>
                <span className="text-stone-500 text-sm">/mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-stone-400">
                    <span className="text-copper mt-0.5">→</span>{f}
                  </li>
                ))}
              </ul>
              <Button asChild variant={plan.featured ? "default" : "outline"} className="w-full" size="lg">
                <Link href="#tool">Empezar gratis →</Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="text-center text-stone-600 text-sm mt-6">Annual: <span className="text-stone-400">25% de descuento</span>. Cancelás cuando querés.</p>
      </section>

      {/* ── MANIFESTO ─────────────────────────────────────────── */}
      <section className="py-32 bg-stone-950 border-t border-white/8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <blockquote className="font-serif text-[clamp(1.75rem,4vw,3rem)] font-bold leading-tight text-stone-300 mb-10">
            "La voz es el único activo que no te pueden copiar.
            <span className="text-copper italic"> Protegela. Escalala. Hacela tuya.</span>"
          </blockquote>
          <Button asChild size="lg">
            <Link href="#tool">Empezá hoy — es gratis →</Link>
          </Button>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-white/8 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-2xl font-bold text-white">GW</span>
            <span className="text-xs text-stone-600 uppercase tracking-widest">by Pisculichi Labs</span>
          </div>
          <div className="flex gap-6">
            <a href="mailto:ipalmeri@uade.edu.ar" className="text-sm text-stone-600 hover:text-copper transition-colors">Contacto</a>
            <a href="https://github.com/nachopalmeri/Cm" target="_blank" rel="noreferrer" className="text-sm text-stone-600 hover:text-copper transition-colors">GitHub</a>
            <Link href="#pricing" className="text-sm text-stone-600 hover:text-copper transition-colors">Precios</Link>
          </div>
          <p className="text-xs text-stone-700">© 2025 Pisculichi Labs</p>
        </div>
      </footer>
    </>
  );
}
""")

print("\nAll files written successfully.")
