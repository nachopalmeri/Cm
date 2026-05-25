"use client";

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [voiceMatch, setVoiceMatch] = useState(85);
  const [correctionsCount, setCorrectionsCount] = useState(0);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [channel, setChannel] = useState('twitter');
  const [format, setFormat] = useState('post');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [brainRes, draftsRes] = await Promise.all([
        fetch('/api/brain'),
        fetch('/api/drafts?limit=10')
      ]);
      const brainData = await brainRes.json();
      const draftsData = await draftsRes.json();
      
      if (brainData.brain) {
        setVoiceMatch(brainData.brain.voice_match_score || 85);
        setCorrectionsCount(brainData.brain.corrections_count || 0);
      }
      setDrafts(draftsData.drafts || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDraft = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/drafts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, channel, format })
      });
      const data = await res.json();
      if (data.draft) {
        setDrafts([data.draft, ...drafts]);
        setShowModal(false);
        setTopic('');
      }
    } catch (error) {
      console.error('Failed to generate draft:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-slate-600">Loading...</div></div>;
  }
  const stats = [
    { label: "Drafts este mes", value: drafts.length.toString() },
    { label: "Voice match", value: `${voiceMatch}%` },
    { label: "Agentes activos", value: "4" },
    { label: "Correcciones aplicadas", value: correctionsCount.toString() },
  ];


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Generate Draft
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Contenido reciente</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {drafts.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-500">
              No drafts yet. Click "Generate Draft" to create your first one.
            </div>
          ) : (
            drafts.map((item) => (
            <div key={item.title} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.channel}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.status === "approved" ? "bg-green-50 text-green-700" : item.status === "pending" ? "bg-yellow-50 text-yellow-700" : "bg-slate-100 text-slate-600"}`}>
                {item.status}
              </span>
            </div>
          ))
          )}
        </div>
      </div>

      {/* Generate Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Generate Draft</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Por qué los builders latinos necesitan mejores herramientas"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500"
                >
                  <option value="twitter">Twitter</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="substack">Substack</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500"
                >
                  <option value="post">Post</option>
                  <option value="thread">Thread</option>
                  <option value="newsletter">Newsletter</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={generateDraft}
                disabled={!topic.trim() || generating}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}