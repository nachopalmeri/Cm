"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const nav = [
  { href: "/dashboard",   label: "Dashboard",     icon: "⬡" },
  { href: "/brain",       label: "Brand Brain",   icon: "◈" },
  {
    href: "/agents", label: "Agents", icon: "◎",
    submenu: [
      { href: "/agents/research",   label: "Research",   icon: "○" },
      { href: "/agents/voice",      label: "Voice",      icon: "○" },
      { href: "/agents/editor",     label: "Editor",     icon: "○" },
      { href: "/agents/distributor",label: "Distributor",icon: "○" },
      { href: "/agents/analytics",  label: "Analytics",  icon: "○" },
    ],
  },
  { href: "/content",       label: "Content",       icon: "◐" },
  { href: "/orchestration", label: "Orchestration", icon: "◉" },
  { href: "/remote-control",label: "Remote",        icon: "⬖", badge: 2 },
  { href: "/settings",      label: "Settings",      icon: "⬙" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(true);

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  return (
    <div className="flex min-h-screen" style={{ background: "#060608" }}>

      {/* ── Mobile toggle ─────────────────────────────────────────────── */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-xl lg:hidden"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <svg className="h-4 w-4 text-white/70" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          background: "rgba(8,8,12,0.95)",
          backdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-3 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
              <span className="text-white text-xs font-bold">G</span>
              <div className="absolute inset-0 rounded-lg" style={{ boxShadow: "0 0 16px rgba(124,58,237,0.5)" }} />
            </div>
            <span className="font-display font-bold text-white text-sm tracking-tight">Ghostwriter</span>
          </Link>
        </div>

        {/* Status pill */}
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
          </span>
          <span className="text-xs font-medium text-green-400">Brain online · 94% match</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => item.submenu && setAgentsOpen(!agentsOpen)}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
                  style={{
                    background: active ? "rgba(124,58,237,0.15)" : "transparent",
                    color: active ? "#a78bfa" : "rgba(255,255,255,0.45)",
                    border: active ? "1px solid rgba(124,58,237,0.2)" : "1px solid transparent",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
                    }
                  }}
                >
                  <span className="text-xs">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                      {item.badge}
                    </span>
                  )}
                  {item.submenu && (
                    <svg className={`h-3 w-3 transition-transform duration-200 ${agentsOpen ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </Link>

                {item.submenu && agentsOpen && (
                  <div className="ml-4 mt-0.5 mb-1 space-y-0.5 border-l pl-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    {item.submenu.map((sub) => {
                      const subActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition-all duration-150"
                          style={{
                            color: subActive ? "#a78bfa" : "rgba(255,255,255,0.3)",
                            background: subActive ? "rgba(124,58,237,0.1)" : "transparent",
                          }}
                          onMouseEnter={e => {
                            if (!subActive) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)";
                          }}
                          onMouseLeave={e => {
                            if (!subActive) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)";
                          }}
                        >
                          <span className={`h-1 w-1 rounded-full ${subActive ? "bg-brand-400" : "bg-white/20"}`} />
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom user card */}
        <div className="mx-3 mb-4 flex items-center gap-3 rounded-xl p-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
            F
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-semibold text-white/70">Founder Plan</p>
            <p className="text-[10px] text-white/30">20 drafts/semana</p>
          </div>
          <svg className="h-3.5 w-3.5 text-white/25" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
          </svg>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          style={{ backdropFilter: "blur(4px)" }} />
      )}

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main className="flex w-full flex-col lg:ml-60">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between px-6"
          style={{
            background: "rgba(6,6,8,0.85)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Link href="/" className="transition hover:text-white/60">Ghostwriter</Link>
            <span>/</span>
            <span className="text-white/60 capitalize">{pathname?.split("/")[1] ?? "dashboard"}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative flex h-8 w-8 items-center justify-center rounded-xl transition hover:bg-white/8"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              <svg className="h-4 w-4 text-white/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-brand-500" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
              F
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-5 sm:p-7">
          {children}
        </div>
      </main>
    </div>
  );
}
