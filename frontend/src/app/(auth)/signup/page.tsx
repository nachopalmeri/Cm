"use client";

import { useState } from "react";
import { createClient } from "@/lib/auth/supabase-browser";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#060608" }}>
        <div className="w-full max-w-sm space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <h1 className="text-xl font-bold text-white">Verifica tu email</h1>
          <p className="text-sm text-white/50">Te enviamos un link a <strong className="text-white/80">{email}</strong></p>
          <a href="/login" className="inline-block text-sm text-purple-400 hover:text-purple-300 transition">Ir a login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#060608" }}>
      <div className="w-full max-w-sm space-y-8 rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>
          <p className="mt-2 text-sm text-white/50">Empieza a construir tu Brand Brain</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Nombre</label>
            <input type="text" value={fullName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50"
              placeholder="Tu nombre" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50"
              placeholder="tu@email.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required minLength={6}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50"
              placeholder="Minimo 6 caracteres" />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>
        <p className="text-center text-xs text-white/40">
          Ya tienes cuenta? <a href="/login" className="text-purple-400 hover:text-purple-300 transition">Ingresa</a>
        </p>
      </div>
    </div>
  );
}