"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/brain", label: "Brand Brain" },
  { href: "/agents", label: "Agents", submenu: [
    { href: "/agents/research", label: "Research" },
    { href: "/agents/voice", label: "Voice" },
    { href: "/agents/editor", label: "Editor" },
    { href: "/agents/distributor", label: "Distributor" },
    { href: "/agents/analytics", label: "Analytics" },
  ]},
  { href: "/content", label: "Content" },
  { href: "/orchestration", label: "Orchestration" },
  { href: "/remote-control", label: "Remote Control", badge: 2 },
  { href: "/mobile-approval", label: "Mobile" },
  { href: "/settings", label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-lg lg:hidden"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center px-6">
          <Link href="/" className="text-lg font-bold text-slate-900">Ghostwriter</Link>
        </div>
        <nav className="space-y-1 px-4 py-4">
          {nav.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={() => item.submenu && setSubmenuOpen(!submenuOpen)}
                className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition ${pathname === item.href || pathname?.startsWith(item.href + "/") ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <span>{item.label}</span>
                {item.badge && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{item.badge}</span>}
                {item.submenu && (
                  <svg className={`h-4 w-4 transition-transform ${submenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </Link>
              {item.submenu && submenuOpen && pathname?.startsWith(item.href) && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.submenu.map((sub: any) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={`block rounded-lg px-3 py-2 text-xs font-medium transition ${pathname === sub.href ? "bg-brand-100 text-brand-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* Main content */}
      <main className="w-full lg:ml-64">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div className="text-sm font-medium text-slate-500">Ghostwriter App</div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-brand-100" />
            <span className="text-sm font-medium text-slate-700">Founder</span>
          </div>
        </header>
        <div className="p-4 sm:p-8">{children}</div>
      </main>
    </div>
  );
}