"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/auth/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push(redirect);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#060608" }}>
      <div className="w-full max-w-sm space-y-8 rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Ghostwriter</h1>
          <p className="mt-2 text-sm text-white/50">Ingresa a tu Brand Brain</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50"
              placeholder="tu@email.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50"
              placeholder="••••••••" />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        <p className="text-center text-xs text-white/40">
          No tenes cuenta? <a href="/signup" className="text-purple-400 hover:text-purple-300 transition">Crea una</a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center" style={{ background: "#060608" }}><div className="text-white/50 text-sm">Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  );
}