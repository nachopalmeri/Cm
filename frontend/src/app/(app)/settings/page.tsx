"use client";



import { useState } from "react";

export default function SettingsPage() {
  const [voiceMatch] = useState(97);
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(false);
  const [autoPublishPlatforms, setAutoPublishPlatforms] = useState<string[]>([]);

  const canEnableAutoPublish = voiceMatch >= 95;

  const togglePlatform = (platform: string) => {
    setAutoPublishPlatforms((prev) => prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]);
  };

  const auditLog = [
    { id: 1, platform: "X", timestamp: "2024-01-15 10:32 AM", status: "published" },
    { id: 2, platform: "LinkedIn", timestamp: "2024-01-15 09:15 AM", status: "published" },
    { id: 3, platform: "X", timestamp: "2024-01-14 04:20 PM", status: "published" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Brand Voice</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500">Nombre de la voz</label>
              <input defaultValue="Founder agresivo" className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Instrucciones de tono</label>
              <textarea defaultValue="Directo, opinionado, sin relleno. Abrir con tesis fuerte." className="mt-1 min-h-24 w-full resize-none rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none focus:border-brand-500" />
            </div>
          </div>
        </div>

        <div className={`rounded-xl border p-6 shadow-sm ${canEnableAutoPublish ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-slate-50"}`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Autonomy Mode</h2>
              <p className="mt-1 text-xs text-slate-600">Auto-publish drafts sin revisión manual</p>
            </div>
            {canEnableAutoPublish ? (
              <button onClick={() => setAutoPublishEnabled(!autoPublishEnabled)} className={`relative h-6 w-11 rounded-full transition ${autoPublishEnabled ? "bg-brand-600" : "bg-slate-200"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${autoPublishEnabled ? "left-5" : "left-0.5"}`} />
              </button>
            ) : (
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600">Locked</span>
            )}
          </div>

          {!canEnableAutoPublish && (
            <div className="mt-4 rounded-lg bg-yellow-50 p-4">
              <p className="text-sm font-semibold text-yellow-900">Voice Match debe ser ≥ 95%</p>
              <p className="mt-1 text-xs text-yellow-700">Actual: {voiceMatch}% · Faltan {95 - voiceMatch}% para desbloquear</p>
            </div>
          )}

          {canEnableAutoPublish && autoPublishEnabled && (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-900">⚠️ Modo autónomo activado</p>
                <p className="mt-1 text-xs text-red-700">El Editor Agent publicará automáticamente drafts aprobados sin tu revisión.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Plataformas con auto-publish</label>
                <div className="mt-2 space-y-2">
                  {["X", "LinkedIn", "Substack"].map((platform) => (
                    <label key={platform} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={autoPublishPlatforms.includes(platform)}
                        onChange={() => togglePlatform(platform)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm text-slate-700">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={() => setAutoPublishEnabled(false)} className="w-full rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100">
                Revert to Manual
              </button>
            </div>
          )}

          {canEnableAutoPublish && autoPublishEnabled && (
            <div className="mt-6 rounded-lg bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Audit Trail</h3>
              <div className="mt-3 space-y-2">
                {auditLog.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{log.platform}</span>
                    <span className="text-slate-500">{log.timestamp}</span>
                    <span className="rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700">{log.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Integraciones</h2>
          <div className="mt-4 space-y-3">
            {["X (Twitter)", "LinkedIn", "Substack", "TikTok"].map((name) => (
              <div key={name} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
                <span className="text-sm text-slate-700">{name}</span>
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">Conectado</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}