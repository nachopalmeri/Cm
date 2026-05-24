"use client";

import { useState } from "react";

interface Notification {
  id: number;
  agent: string;
  preview: string;
  channel: string;
  status: "pending" | "approved" | "rejected";
}

const initialNotifications: Notification[] = [
  { id: 1, agent: "Voice Agent", preview: "Los agentes de IA sin memoria persistente son básicamente autocomplete con una interfaz bonita...", channel: "X thread", status: "pending" },
  { id: 2, agent: "Voice Agent", preview: "La marca ya no se construye con posts aislados. Se construye con sistemas que memorizan tu voz...", channel: "Substack", status: "pending" },
  { id: 3, agent: "Distributor", preview: "Thread adaptado a 4 formatos: X, LinkedIn, Newsletter, TikTok script.", channel: "Multicanal", status: "pending" },
];

export default function MobileApprovalPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [toast, setToast] = useState("");

  const act = (id: number, action: "approved" | "rejected") => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, status: action } : n));
    setToast(action === "approved" ? "✅ Publicado en " + notifications.find((n) => n.id === id)?.channel : "❌ Rechazado");
    setTimeout(() => setToast(""), 2000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      {/* Phone frame */}
      <div className="w-full max-w-sm rounded-[2.5rem] border-8 border-slate-800 bg-white shadow-2xl">
        {/* Notch */}
        <div className="mx-auto mt-3 h-6 w-24 rounded-full bg-slate-800" />

        <div className="px-5 py-6">
          <div className="mb-6 text-center">
            <p className="text-lg font-bold text-slate-900">Ghostwriter</p>
            <p className="text-xs text-slate-500">Aprobación rápida</p>
          </div>

          <div className="space-y-4">
            {notifications.map((n) => (
              <div key={n.id} className={`rounded-2xl border p-4 ${n.status === "pending" ? "border-brand-200 bg-brand-50" : n.status === "approved" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">
                    {n.agent[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{n.agent}</p>
                    <p className="text-[10px] text-slate-500">{n.channel}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{n.preview}</p>
                {n.status === "pending" && (
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => act(n.id, "approved")} className="flex-1 rounded-xl bg-green-600 py-2 text-sm font-semibold text-white transition hover:bg-green-700">
                      ✅ Aprobar
                    </button>
                    <button onClick={() => act(n.id, "rejected")} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                      ❌ Rechazar
                    </button>
                  </div>
                )}
                {n.status === "approved" && (
                  <p className="mt-3 text-xs font-semibold text-green-700">Publicado en {n.channel}</p>
                )}
                {n.status === "rejected" && (
                  <p className="mt-3 text-xs font-semibold text-red-700">Rechazado</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}