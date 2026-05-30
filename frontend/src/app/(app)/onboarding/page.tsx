"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function getBarClass(active: boolean) {
  return "h-2 w-8 rounded-full " + (active ? "bg-purple-500" : "bg-white/10");
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [tone, setTone] = useState("");
  const [samples, setSamples] = useState(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const updateSample = (index: number, value: string) => {
    const next = [...samples];
    next[index] = value;
    setSamples(next);
  };

  const submitOnboarding = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brain", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name || "My Brand Voice", tone, sample_texts: samples.filter(Boolean) }) });
      if (!res.ok) throw new Error("Failed to save");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError("Error al guardar. Intenta de nuevo.");
      setLoading(false);
    }
  };

  const isStep1Valid = name.trim().length > 0;
  const isStep2Valid = samples.filter(Boolean).length >= 1;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center" style={{ background: "#060608" }}>
      <div className="w-full max-w-lg space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className={getBarClass(step >= 1)} />
          <div className={getBarClass(step >= 2)} />
          <div className={getBarClass(step >= 3)} />
        </div>

        {step === 1 && (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Bienvenido a Ghostwriter</h1>
              <p className="mt-2 text-sm text-white/50">Configuremos tu Brand Brain en 2 pasos</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Nombre de tu Brand Voice</label>
                <input type="text" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50"
                  placeholder="Ej: Mi Voz Personal" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Tono (opcional)</label>
                <input type="text" value={tone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTone(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50"
                  placeholder="Ej: Profesional pero cercano" />
              </div>
              <button onClick={() => setStep(2)} disabled={!isStep1Valid}
                className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-30">
                Continuar
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Tus Samples</h1>
              <p className="mt-2 text-sm text-white/50">Pega al menos 1 texto que represente tu voz (ideal 3)</p>
            </div>
            <div className="space-y-3">
              {samples.map((s, i) => (
                <textarea key={i} value={s} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSample(i, e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50"
                  rows={3} placeholder={"Sample " + (i + 1)} />
              ))}
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5">
                  Atras
                </button>
                <button onClick={submitOnboarding} disabled={!isStep2Valid || loading}
                  className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-30">
                  {loading ? "Guardando..." : "Crear Brand Brain"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}