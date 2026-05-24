"use client";



import { useState, useRef, useEffect } from "react";

interface Message {
  id: number;
  type: "system" | "user" | "command_response";
  content: string;
  timestamp: string;
  actions?: { label: string; action: string }[];
}

interface Notification {
  id: number;
  type: "draft_ready" | "draft_published" | "voice_match_update" | "correction_needed";
  message: string;
  timestamp: string;
  read: boolean;
}

export default function RemoteControlPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: "system", content: "🔔 Nuevo draft listo: 'Thread sobre AI agents' (X)", timestamp: "10:32 AM", actions: [{ label: "✅ Approve", action: "approve_1" }, { label: "❌ Reject", action: "reject_1" }, { label: "✏️ Edit", action: "edit_1" }] },
    { id: 2, type: "system", content: "✅ Draft aprobado y publicado en LinkedIn", timestamp: "09:15 AM" },
    { id: 3, type: "system", content: "⚠️ Editor bloqueó draft por frase prohibida: 'revolucionario'", timestamp: "08:45 AM" },
  ]);
  const [input, setInput] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, type: "draft_ready", message: "Nuevo draft pendiente de aprobación", timestamp: "10:32 AM", read: false },
    { id: 2, type: "voice_match_update", message: "Voice match subió a 96%", timestamp: "Yesterday", read: false },
    { id: 3, type: "draft_published", message: "5 drafts publicados hoy", timestamp: "Yesterday", read: true },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [editingDraft, setEditingDraft] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendCommand = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: messages.length + 1,
      type: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      let response = "";
      if (input.startsWith("/approve")) {
        response = "✅ Draft aprobado. Publicando en X en 2h.";
      } else if (input.startsWith("/reject")) {
        response = "❌ Draft rechazado. Voice Agent aprenderá de esto.";
      } else if (input.startsWith("/vibe:")) {
        const vibe = input.replace("/vibe:", "").trim();
        response = `✅ Regla aplicada: "${vibe}" → Voice Agent actualizado`;
      } else if (input === "/stats") {
        response = "📊 Stats hoy:\n• 5 drafts generados\n• 4 aprobados (80%)\n• Voice match: 96%\n• Tiempo ahorrado: 3.2h";
      } else if (input === "/pause") {
        response = "⏸️ Pipeline pausado. Usa /resume para continuar.";
      } else if (input === "/resume") {
        response = "▶️ Pipeline reanudado.";
      } else {
        response = "❓ Comando no reconocido. Usa /approve, /reject, /vibe:, /stats, /pause, /resume";
      }

      const responseMsg: Message = {
        id: messages.length + 2,
        type: "command_response",
        content: response,
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, responseMsg]);
    }, 500);

    setInput("");
  };

  const handleAction = (action: string) => {
    if (action.startsWith("approve")) {
      const msg: Message = {
        id: messages.length + 1,
        type: "command_response",
        content: "✅ Draft aprobado. Publicando en 2h.",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, msg]);
    } else if (action.startsWith("reject")) {
      const msg: Message = {
        id: messages.length + 1,
        type: "command_response",
        content: "❌ Draft rechazado.",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, msg]);
    } else if (action.startsWith("edit")) {
      setEditingDraft(action);
      setEditText("Los agentes de IA sin memoria persistente son básicamente autocomplete con una interfaz bonita...");
    }
  };

  const saveEdit = () => {
    const msg: Message = {
      id: messages.length + 1,
      type: "command_response",
      content: "✅ Corrección guardada. Regla aprendida: 'Evitar buzzwords'",
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
    setEditingDraft(null);
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      {/* Phone frame */}
      <div className="relative w-full max-w-sm">
        {/* Notification badge */}
        {unreadCount > 0 && (
          <div className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg">
            {unreadCount}
          </div>
        )}

        <div className="rounded-[2.5rem] border-8 border-slate-800 bg-white shadow-2xl">
          {/* Notch */}
          <div className="mx-auto mt-3 h-6 w-24 rounded-full bg-slate-800" />

          {/* Header */}
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-slate-900">Ghostwriter</p>
                <p className="text-xs text-slate-500">Remote Control</p>
              </div>
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative rounded-lg bg-slate-100 p-2 transition hover:bg-slate-200">
                <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadCount > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />}
              </button>
            </div>
          </div>

          {/* Notifications panel */}
          {showNotifications && (
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
              <div className="mt-3 space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} onClick={() => markAsRead(n.id)} className={`cursor-pointer rounded-lg border px-3 py-2 ${n.read ? "border-slate-100 bg-white" : "border-brand-200 bg-brand-50"}`}>
                    <p className="text-sm font-medium text-slate-900">{n.message}</p>
                    <p className="text-xs text-slate-500">{n.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="h-[500px] overflow-y-auto px-5 py-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`${msg.type === "user" ? "flex justify-end" : ""}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.type === "user" ? "bg-brand-600 text-white" : msg.type === "command_response" ? "bg-green-50 text-green-900" : "bg-slate-100 text-slate-900"}`}>
                    <p className="whitespace-pre-line text-sm leading-6">{msg.content}</p>
                    <p className={`mt-1 text-xs ${msg.type === "user" ? "text-brand-100" : "text-slate-500"}`}>{msg.timestamp}</p>
                    {msg.actions && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.actions.map((action) => (
                          <button key={action.action} onClick={() => handleAction(action.action)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 px-5 py-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendCommand()}
                placeholder="/approve, /vibe:, /stats..."
                className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500"
              />
              <button onClick={sendCommand} className="rounded-full bg-brand-600 p-2 text-white transition hover:bg-brand-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={() => setInput("/stats")} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200">
                📊 Stats
              </button>
              <button onClick={() => setInput("/vibe: más directo")} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200">
                ✏️ Vibe
              </button>
              <button onClick={() => setInput("/pause")} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200">
                ⏸️ Pause
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard shortcuts */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <a href="/brain" className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:bg-slate-50">
            <p className="text-sm font-semibold text-slate-900">Brand Brain</p>
            <p className="text-xs text-slate-500">Ver reglas</p>
          </a>
          <a href="/agents/analytics" className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:bg-slate-50">
            <p className="text-sm font-semibold text-slate-900">Analytics</p>
            <p className="text-xs text-slate-500">Ver métricas</p>
          </a>
          <a href="/orchestration" className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:bg-slate-50">
            <p className="text-sm font-semibold text-slate-900">Pipeline</p>
            <p className="text-xs text-slate-500">Ver status</p>
          </a>
          <a href="/settings" className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:bg-slate-50">
            <p className="text-sm font-semibold text-slate-900">Settings</p>
            <p className="text-xs text-slate-500">Configurar</p>
          </a>
        </div>
      </div>

      {/* Edit modal */}
      {editingDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Edit Draft</h3>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="mt-4 min-h-32 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm leading-7 text-slate-900 outline-none focus:border-brand-500"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setEditingDraft(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={saveEdit} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
                Save Correction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}