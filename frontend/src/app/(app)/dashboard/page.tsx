"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Draft {
  id: string;
  content: string;
  channel: string;
  status: string;
  voice_match_score?: number;
  created_at: string;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const statusConfig: Record<string, { label: string; badge: string }> = {
  approved: { label: "Aprobado",  badge: "badge-green" },
  pending:  { label: "Pendiente", badge: "badge-orange" },
  draft:    { label: "Borrador",  badge: "badge-purple" },
};

const channelIcons: Record<string, string> = {
  twitter: "𝕏", linkedin: "in", substack: "S", tiktok: "♪", instagram: "◎",
};

/* ─── Generate modal ─────────────────────────────────────────────────────── */
function GenerateModal({ onClose, onGenerate }: { onClose: () => void; onGenerate: (d: any) => void }) {
  const [topic, setTopic] = useState("");
  const [channel, setChannel] = useState("twitter");
  const [format, setFormat] = useState("post");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/drafts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, channel, format }),
      });
      const data = await res.json();
      if (data.draft) onGenerate(data.draft);
    } catch {
      onGenerate({ id: Date.now().toString(), content: `Draft sobre: ${topic}`, channel, status: "draft", voice_match_score: 87, created_at: new Date().toISOString() });
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" style={{ backdropFilter: "blur(8px)" }} onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-3xl p-6"
        style={{ background: "#0d0d12", border: "1px solid rgba(124,58,237,0.3)", boxShadow: "0 0 80px rgba(124,58,237,0.15)" }}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">Generar draft</h2>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/40 transition hover:text-white"
            style={{ background: "rgba(255,255,255,0.06)" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/30">Tema</label>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="IA en educación, fundraising, producto..."
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
              required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/30">Canal</label>
              <select value={channel} onChange={e => setChannel(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                {["twitter","linkedin","substack","tiktok"].map(c => (
                  <option key={c} value={c} style={{ background: "#0d0d12" }}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/30">Formato</label>
              <select value={format} onChange={e => setFormat(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                {["post","thread","newsletter","script"].map(f => (
                  <option key={f} value={f} style={{ background: "#0d0d12" }}>{f}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 mt-2 disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generando...
              </span>
            ) : "Generar draft →"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [brain, setBrain] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("/api/brain").then(r => r.json()).then(setBrain).catch(() => {});
    fetch("/api/drafts?limit=10").then(r => r.json()).then(d => setDrafts(d.drafts ?? [])).catch(() => {
      setDrafts([
        { id: "1", content: "La IA no te va a reemplazar. Te va a reemplazar alguien que usa IA mejor que vos.", channel: "twitter", status: "approved", voice_match_score: 94, created_at: new Date().toISOString() },
        { id: "2", content: "Thread: 7 cosas que aprendí construyendo mi primer producto de IA...", channel: "twitter", status: "pending", voice_match_score: 88, created_at: new Date(Date.now()-86400000).toISOString() },
        { id: "3", content: "Newsletter: El futuro del trabajo creativo en un mundo de agentes...", channel: "substack", status: "draft", voice_match_score: 82, created_at: new Date(Date.now()-172800000).toISOString() },
        { id: "4", content: "Cómo pasé de 0 a 1000 seguidores en LinkedIn sin postear todos los días...", channel: "linkedin", status: "approved", voice_match_score: 91, created_at: new Date(Date.now()-259200000).toISOString() },
      ]);
    });
  }, []);

  const stats = [
    { label: "Drafts totales",    value: drafts.length || 24,        icon: "◐", color: "text-cyan-400",    glow: "rgba(6,182,212,0.12)" },
    { label: "Voice match",       value: `${brain?.voice_match_score ?? 94}%`, icon: "◈", color: "text-violet-400", glow: "rgba(124,58,237,0.12)" },
    { label: "Agentes activos",   value: 4,                           icon: "◎", color: "text-green-400",  glow: "rgba(34,197,94,0.1)" },
    { label: "Reglas aprendidas", value: brain?.rules?.length ?? 15,  icon: "◆", color: "text-orange-400", glow: "rgba(249,115,22,0.1)" },
  ];

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-white/35">Tu sistema de contenido en tiempo real</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm px-5 py-2.5">
          + Generar draft
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card" style={{ boxShadow: `0 4px 20px ${s.glow}` }}>
            <div className="mb-3 flex items-center justify-between">
              <span className={`text-lg ${s.color}`}>{s.icon}</span>
              <span className={`text-xs font-semibold ${s.color} opacity-60`}>↑</span>
            </div>
            <p className="font-display text-3xl font-bold text-white">{s.value}</p>
            <p className="mt-1.5 text-xs text-white/35">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Drafts list */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <h2 className="font-display text-sm font-semibold text-white/70">Contenido reciente</h2>
              <Link href="/content" className="text-xs text-brand-400 transition hover:text-brand-300">Ver todo →</Link>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {drafts.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-white/25">No hay drafts aún.</p>
                  <button onClick={() => setShowModal(true)} className="mt-4 text-sm text-brand-400 underline">
                    Generar el primero
                  </button>
                </div>
              ) : (
                drafts.map((d) => {
                  const s = statusConfig[d.status] ?? statusConfig.draft;
                  return (
                    <div key={d.id} className="group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-white/[0.025]">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white/60"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        {channelIcons[d.channel] ?? d.channel[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm text-white/75 group-hover:text-white/90 transition-colors">{d.content}</p>
                        <div className="mt-1.5 flex items-center gap-3">
                          <span className="text-[10px] text-white/25">
                            {new Date(d.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                          </span>
                          {d.voice_match_score && (
                            <span className="text-[10px] font-medium text-brand-400">{d.voice_match_score}% match</span>
                          )}
                        </div>
                      </div>
                      <span className={`badge shrink-0 ${s.badge}`}>{s.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-5">
          {/* Brand Brain card */}
          <div className="rounded-3xl p-5"
            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", boxShadow: "0 0 40px rgba(124,58,237,0.06)" }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-white/70">Brand Brain</h3>
              <Link href="/brain" className="text-xs text-brand-400 hover:text-brand-300">Editar →</Link>
            </div>
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-white/40">Voice match</span>
                <span className="font-display text-lg font-bold text-white">{brain?.voice_match_score ?? 94}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${brain?.voice_match_score ?? 94}%`,
                    background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
                    boxShadow: "0 0 12px rgba(124,58,237,0.5)",
                  }} />
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: "Reglas activas",       value: brain?.rules?.length ?? 15 },
                { label: "Correcciones totales", value: 28 },
                { label: "Tono detectado",       value: "Directo, técnico" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-white/30">{item.label}</span>
                  <span className="text-xs font-medium text-white/70">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agents status */}
          <div className="rounded-3xl p-5"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-white/70">Agentes</h3>
              <Link href="/agents" className="text-xs text-brand-400 hover:text-brand-300">Ver todo →</Link>
            </div>
            <div className="space-y-2.5">
              {[
                { name: "Research",    active: true,  last: "Analizando tendencias" },
                { name: "Voice",       active: true,  last: "Draft generado" },
                { name: "Editor",      active: true,  last: "Sin AI slop · aprobado" },
                { name: "Distributor", active: false, last: "En espera de aprobación" },
              ].map(agent => (
                <div key={agent.name} className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`h-1.5 w-1.5 rounded-full ${agent.active ? "bg-green-400" : "bg-white/20"}`} />
                    {agent.active && <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-40" />}
                  </div>
                  <span className="w-20 shrink-0 text-xs font-medium text-white/60">{agent.name}</span>
                  <span className="truncate text-[10px] text-white/25">{agent.last}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Brand Brain",   href: "/brain",            icon: "◈", color: "text-violet-400" },
              { label: "Orchestration", href: "/orchestration",    icon: "◉", color: "text-cyan-400" },
              { label: "Analytics",     href: "/agents/analytics", icon: "↗", color: "text-green-400" },
              { label: "Remote",        href: "/remote-control",   icon: "⬖", color: "text-orange-400" },
            ].map(a => (
              <Link key={a.href} href={a.href}
                className="flex flex-col gap-1.5 rounded-2xl p-3.5 transition-all hover:scale-[1.02]"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className={`text-base ${a.color}`}>{a.icon}</span>
                <span className="text-xs font-medium text-white/50">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <GenerateModal
          onClose={() => setShowModal(false)}
          onGenerate={(d) => setDrafts(prev => [d, ...prev])}
        />
      )}
    </div>
  );
}
