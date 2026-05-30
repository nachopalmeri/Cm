"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/auth/supabase-browser";
import type { User } from "@supabase/supabase-js";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/brain", label: "Brand Brain" },
  { href: "/content", label: "Editor" },
  { href: "/settings", label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#060608" }}>
        <div className="text-white/50 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#060608" }}>
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-white/10 bg-white/5 p-2 lg:hidden"
      >
        <svg className="h-6 w-6 text-white/70" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-white/[0.02] backdrop-blur-sm transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center px-6">
          <Link href="/" className="font-display text-lg font-bold text-white">Ghostwriter</Link>
        </div>
        <nav className="space-y-1 px-4 py-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition ${pathname === item.href || pathname?.startsWith(item.href + "/") ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white/80"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                {user?.email?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-white/80 truncate">{user?.email || "User"}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-white/40 hover:text-white/80 transition" title="Logout">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/50 lg:hidden" />
      )}

      <main className="w-full lg:ml-64">
        <header className="flex h-16 items-center justify-between border-b border-white/10 px-8">
          <div className="text-sm font-medium text-white/40">Ghostwriter</div>
        </header>
        <div className="p-4 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
