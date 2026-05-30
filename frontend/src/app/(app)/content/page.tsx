"use client";

import { useState, useEffect } from "react";

interface Draft {
  id: string;
  title: string;
  content: string;
  channel: string;
  status: string;
  voice_match_score: number | null;
  created_at: string;
}

interface Comment {
  id: string;
  type: string;
  severity: string;
  category: string;
  content: string;
  is_resolved: boolean;
}

export default function EditorPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [editContent, setEditContent] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { fetchDrafts(); }, []);

  const fetchDrafts = async () => {
    try {
      const res = await fetch("/api/drafts?limit=50");
      const data = await res.json();
      setDrafts(data.drafts || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const selectDraft = async (draft: Draft) => {
    setSelectedDraft(draft);
    setEditContent(draft.content);
    fetchComments(draft.id);
  };

  const fetchComments = async (draftId: string) => {
    try {
      const res = await fetch("/api/drafts/" + draftId + "/comments");
      const data = await res.json();
      setComments(data.comments || []);
    } catch (e) { console.error(e); }
  };

  const saveDraft = async () => {
    if (!selectedDraft) return;
    setSaving(true);
    try {
      await fetch("/api/drafts/" + selectedDraft.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent })
      });
      setSelectedDraft({ ...selectedDraft, content: editContent });
      showToast("Draft guardado");
    } catch (e) { showToast("Error al guardar"); }
    finally { setSaving(false); }
  };

  const learnFromCorrection = async () => {
    if (!selectedDraft) return;
    const original = selectedDraft.content;
    const corrected = editContent;
    if (original === corrected) { showToast("No hay cambios para aprender"); return; }
    setCorrecting(true);
    try {
      const res = await fetch("/api/voice/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_id: selectedDraft.id, original_text: original, corrected_text: corrected })
      });
      if (res.ok) {
        showToast("Voice aprendio de tu correccion!");
        setSelectedDraft({ ...selectedDraft, content: corrected });
      } else {
        showToast("Error al aprender");
      }
    } catch (e) { showToast("Error al aprender"); }
    finally { setCorrecting(false); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const getSeverityColor = (s: string) => {
    if (s === "error") return "text-red-400 border-red-500/20 bg-red-500/10";
    if (s === "warning") return "text-yellow-400 border-yellow-500/20 bg-yellow-500/10";
    return "text-blue-400 border-blue-500/20 bg-blue-500/10";
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Sidebar: Drafts list */}
      <div className="w-64 flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.02] p-4 overflow-y-auto">
        <h2 className="text-sm font-semibold text-white/70 mb-3">Drafts</h2>
        {loading ? <p className="text-xs text-white/40">Cargando...</p> : drafts.length === 0 ? <p className="text-xs text-white/40">No hay drafts</p> : (
          <div className="space-y-2">
            {drafts.map(d => (
              <button key={d.id} onClick={() => selectDraft(d)}
                className={"w-full text-left rounded-lg px-3 py-2 text-xs transition " + (selectedDraft?.id === d.id ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white/80")}>
                <div className="font-medium truncate">{d.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/30">{d.channel}</span>
                  <span className={"text-xs px-1.5 py-0.5 rounded " + (d.voice_match_score && d.voice_match_score >= 80 ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400")}>
                    {d.voice_match_score || 0}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main: Editor */}
      <div className="flex-1 flex gap-4 min-w-0">
        <div className="flex-1 flex flex-col min-w-0">
          {selectedDraft ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-lg font-bold text-white">{selectedDraft.title}</h1>
                  <p className="text-xs text-white/40">{selectedDraft.channel} · Score: {selectedDraft.voice_match_score || 0}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveDraft} disabled={saving}
                    className="rounded-lg bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/20 disabled:opacity-50">
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  <button onClick={learnFromCorrection} disabled={correcting}
                    className="rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
                    {correcting ? "Aprendiendo..." : "Aprender correccion"}
                  </button>
                </div>
              </div>
              <textarea value={editContent} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)}
                className="flex-1 w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50 resize-none"
                placeholder="Edita tu draft aqui..." />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
              Selecciona un draft para editar
            </div>
          )}
        </div>

        {/* Comments panel */}
        <div className="w-72 flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.02] p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold text-white/70 mb-3">Comentarios ({comments.length})</h2>
          {selectedDraft && comments.length === 0 ? <p className="text-xs text-white/40">Sin comentarios</p> : (
            <div className="space-y-2">
              {comments.map(c => (
                <div key={c.id} className={"rounded-lg border p-3 text-xs " + getSeverityColor(c.severity)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium uppercase">{c.category}</span>
                    <span className={"px-1.5 py-0.5 rounded " + (c.is_resolved ? "bg-green-500/10 text-green-400" : "bg-white/5 text-white/40")}>{c.is_resolved ? "Resuelto" : "Pendiente"}</span>
                  </div>
                  <p className="text-white/70">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 rounded-lg border border-white/10 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}