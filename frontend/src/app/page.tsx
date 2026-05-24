"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import BrainBuilder from "@/components/BrainBuilder";

const agents = [
  { name: "Research", copy: "Detecta señales del mercado, tendencias y ángulos antes de escribir." },
  { name: "Voice", copy: "Convierte contexto en contenido con tu tono, ritmo y vocabulario." },
  { name: "Editor", copy: "Audita cada draft contra tu Brand Brain y elimina AI slop." },
  { name: "Distributor", copy: "Adapta el mismo vibe a X, LinkedIn, newsletter y TikTok scripts." },
];

const phases = [
  "Pegás tu URL, posts o audios.",
  "Ghostwriter extrae tu ADN narrativo.",
  "Se crea tu Brand Brain vivo.",
  "Los agentes ejecutan contenido multicanal.",
  "Cada corrección entrena el sistema.",
];

const comparisons = [
  ["Chatbot", "Responde cuando le pedís algo", "Agentic System", "Planifica, escribe, audita y prepara distribución"],
  ["Prompt", "Se pierde al cerrar la sesión", "Brand Brain", "Memoria viva que compone valor con cada corrección"],
  ["Texto", "Un output aislado", "Content OS", "Un sistema de piezas adaptadas por canal"],
];

const brainFeatures = [
  { title: "Contexto histórico", desc: "Tus posts, audios y URLs alimentan una memoria que no se borra entre sesiones." },
  { title: "Reglas de voz", desc: "El sistema extrae automáticamente tu tono, vocabulario, frases prohibidas y estructuras preferidas." },
  { title: "Correcciones persistentes", desc: "Cada edición genera una regla. El próximo draft ya la incorpora sin que vos repitas nada." },
];

const faqs = [
  { q: "Es solo un generador de posts con IA?", a: "No. Ghostwriter es un sistema agéntico que captura tu voz, la memoriza y coordina sub-agentes para ejecutar contenido multicanal. No es un chatbot." },
  { q: "Mis datos entrenan modelos públicos?", a: "No. Tu Brand Brain es privado y aislado. Solo vos y tu equipo de confianza acceden a tu voz entrenada." },
  { q: "Puedo aprobar todo antes de publicar?", a: "Sí. Approval-first es el default. Nada se publica sin tu OK. Podés configurar autonomía progresiva por canal y tipo de contenido." },
  { q: "Cuánto tarda el onboarding?", a: "Menos de 3 minutos. Pegás tu contenido existente, elegís tu vibe y el sistema genera tu Brand Brain inicial. Cada corrección lo mejora." },
  { q: "Funciona para equipos o solo founders?", a: "Ambos. El Founder plan es para personal brands. El Brand System plan gestiona múltiples voces de marca. Enterprise incluye white-label." },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Navbar />

      {/* Hero */}
      <section className="relative px-6 pt-32 pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                120x más rápido que redacción manual
              </div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
                Agentic Brand System
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                Tu voz. Ejecutada por agentes.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                Ghostwriter no es un chatbot ni un generador de posts. Es el sistema operativo de tu marca personal: captura tu Brand Brain, coordina sub-agentes y convierte ideas en presencia global con aprobación humana.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <a href="#onboarding" className="rounded-xl bg-brand-600 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-brand-700">
                  Crear mi Brand Brain
                </a>
                <a href="#agents" className="rounded-xl border border-slate-200 px-8 py-3.5 text-base font-semibold text-slate-700 transition hover:bg-slate-50">
                  Ver sistema de agentes
                </a>
              </div>
            </div>
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="space-y-3">
                {[
                  { label: "Regla aprendida", value: "Evitar buzzwords y frases genéricas de IA" },
                  { label: "Voice match", value: "94% — mejorando con cada corrección" },
                  { label: "Canales listos", value: "X · LinkedIn · Substack · TikTok script" },
                  { label: "Editor Agent", value: "Sin AI slop detectado — aprobado" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3">
                    <span className="mt-0.5 text-xs text-brand-600">◆</span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                      <p className="mt-1 text-sm text-slate-700">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof + testimonio */}
      <section className="px-6 py-16 bg-slate-50">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <svg className="mx-auto h-10 w-10 text-brand-200" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
            <blockquote className="mx-auto mt-6 max-w-3xl text-2xl font-medium leading-9 text-slate-900">
              "Ghostwriter nos devolvió 20 horas semanales. La coherencia de marca entre LinkedIn y newsletter mejoró un 300%. Voice match del 94%. No es un generador de texto, es un miembro del equipo."
            </blockquote>
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">MC</div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">Mariana Costa</p>
                <p className="text-xs text-slate-500">CEO, PiscuLabs · Founder agresivo</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-slate-100 pt-8 opacity-60">
              {["Acme Inc", "Globex", "Hooli", "Initech", "Massive"].map((name) => (
                <span key={name} className="text-lg font-bold text-slate-400">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="border-y border-slate-100 bg-white py-4 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="mx-8 text-sm font-medium text-slate-400">
              Memoria persistente · Feedback loop real · Drafts en segundos · Aprobás vos, siempre · X · LinkedIn · Substack · TikTok · Voice Agent · Speed to Content · Brand Brain ·
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-8 border-t border-slate-100 pt-10">
          <div className="text-center">
            <div className="text-4xl font-bold text-slate-900">120x</div>
            <p className="mt-1 text-sm text-slate-500">más rápido que redacción manual</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-slate-900">60s</div>
            <p className="mt-1 text-sm text-slate-500">de idea a draft aprobado</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-slate-900">∞</div>
            <p className="mt-1 text-sm text-slate-500">memoria que compone valor</p>
          </div>
        </div>
      </section>

      {/* Brand Brain */}
      <section id="brain" className="px-6 py-24 bg-slate-50">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold text-brand-600">The asset</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-2">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              El Brand Brain reemplaza al prompt.
            </h2>
            <p className="text-lg leading-8 text-slate-600">
              Cada post, audio, URL y corrección entrena un activo digital permanente. No pedís contenido desde cero: activás un cerebro de marca que recuerda cómo hablás, qué evitás y qué estilo convierte.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {brainFeatures.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents */}
      <section id="agents" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold text-brand-600">Execution layer</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            No conversa. Coordina trabajo.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {agents.map((a) => (
              <div key={a.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 font-bold text-sm">
                  {a.name[0]}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{a.name} Agent</h3>
                <p className="mt-3 leading-7 text-slate-600">{a.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Onboarding */}
      <section id="onboarding" className="px-6 py-24 bg-slate-50">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold text-brand-600">Onboarding en 3 minutos</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            De cero a clon operativo.
          </h2>
          <div className="mt-12 grid gap-10 lg:grid-cols-[0.4fr_1fr]">
            <div className="space-y-4">
              {phases.map((phase, i) => (
                <div key={phase} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-600">
                    {i + 1}
                  </div>
                  <p className="text-sm leading-6 text-slate-700">{phase}</p>
                </div>
              ))}
            </div>
            <BrainBuilder />
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold text-brand-600">Category shift</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            La redacción manual es el viejo CRM de la marca personal.
          </h2>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            El próximo salto no es escribir más rápido en un chat. Es tener un sistema que entiende contexto, protege voz, coordina agentes y convierte tu pensamiento en distribución.
          </p>
          <div className="mt-12 space-y-4">
            {comparisons.map(([oldLabel, oldCopy, newLabel, newCopy], i) => (
              <div key={oldLabel} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{oldLabel}</p>
                  <p className="mt-2 text-slate-500">{oldCopy}</p>
                </div>
                <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{newLabel}</p>
                  <p className="mt-2 text-slate-700">{newCopy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24 bg-slate-50">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold text-brand-600">Pricing</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Contratá tu Voice Agent.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { name: "Founder", price: "$499", period: "/mes", desc: "Para personal brands de founders que quieren escalar su voz sin perder autenticidad.", features: ["1 voz entrenada", "3 plataformas", "20 drafts/semana", "Approval-first", "Brand Brain básico"], cta: "Empezar", featured: false },
              { name: "Brand System", price: "$2,499", period: "/mes", desc: "Para startups y empresas que gestionan múltiples voces de marca.", features: ["5 voces entrenadas", "Todas las plataformas", "Drafts ilimitados", "API access", "Team collaboration", "Analytics básico"], cta: "Solicitar demo", featured: true },
              { name: "Enterprise", price: "Custom", period: "", desc: "Para agencias premium y marcas globales que necesitan white-label y control total.", features: ["Voces ilimitadas", "White-label", "SSO + SLA 99.9%", "CSM dedicado", "Custom integrations", "Audit logs"], cta: "Contactar ventas", featured: false },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl border bg-white p-8 shadow-sm ${plan.featured ? "border-brand-300 ring-1 ring-brand-300" : "border-slate-200"}`}>
                {plan.featured && <div className="mb-4 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">RECOMENDADO</div>}
                <p className="text-sm font-semibold text-slate-500">{plan.name}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{plan.desc}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-0.5 text-brand-600">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button className={`mt-8 w-full rounded-xl py-3 font-semibold transition ${plan.featured ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI */}
      <section id="roi" className="px-6 py-24">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-brand-600 p-10 md:p-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-brand-200">Speed to Content</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Te devolvemos 40 horas al mes y convertimos tu voz en infraestructura.
              </h2>
              <p className="mt-4 text-lg leading-8 text-brand-100">
                El ROI no está en generar más texto. Está en eliminar revisión infinita, mantener coherencia de marca y ejecutar distribución multicanal.
              </p>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/10 p-5 text-center">
                <div className="text-3xl font-bold text-white">120x</div>
                <p className="mt-1 text-xs text-brand-200">más rápido</p>
              </div>
              <div className="rounded-xl bg-white/10 p-5 text-center">
                <div className="text-3xl font-bold text-white">5</div>
                <p className="mt-1 text-xs text-brand-200">correcciones → 95% match</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-24 bg-slate-50">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold text-brand-600">FAQ</p>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Preguntas que importan.
          </h2>
          <div className="mt-10 space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between px-6 py-5 text-left">
                  <span className="text-sm font-medium text-slate-900">{faq.q}</span>
                  <span className="text-xl text-slate-400 transition-transform duration-300" style={{ transform: openFaq === i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
                </button>
                <div className="overflow-hidden transition-all duration-500" style={{ maxHeight: openFaq === i ? "200px" : "0", opacity: openFaq === i ? 1 : 0 }}>
                  <p className="px-6 pb-5 text-sm leading-7 text-slate-600">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl rounded-3xl bg-slate-900 p-10 text-center md:p-16">
          <p className="text-sm font-semibold text-brand-400">Global Day Zero</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Tu voz puede estar en todas partes sin que vos estés escribiendo.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-300">
            El producto no promete crecer por magia. Promete construir infraestructura: memoria, control, velocidad y consistencia para competir globalmente.
          </p>
          <a href="#onboarding" className="mt-8 inline-flex rounded-xl bg-brand-600 px-8 py-3.5 font-semibold text-white transition hover:bg-brand-700">
            Construir mi Voice Agent
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-900">Ghostwriter</span>
            <span className="text-xs text-slate-400">Agentic Brand System</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#brain" className="transition hover:text-slate-900">Brand Brain</a>
            <a href="#agents" className="transition hover:text-slate-900">Agents</a>
            <a href="#pricing" className="transition hover:text-slate-900">Pricing</a>
            <a href="#roi" className="transition hover:text-slate-900">ROI</a>
          </div>
          <p className="text-xs text-slate-400">© 2025 PiscuLabs</p>
        </div>
      </footer>
    </main>
  );
}