"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Draft {
  id: string;
  title: string;
  content: string;
  channel: string;
  status: string;
  voice_match_score: number | null;
  created_at: string;
}

interface Brain {
  voice_match_score: number;
  corrections_count: number;
  rules: { rule: string; category: string }[];
}

export default function DashboardPage() {
  const [voiceMatch, setVoiceMatch] = useState(0);
  const [correctionsCount, setCorrectionsCount] = useState(0);
  const [rulesCount, setRulesCount] = useState(0);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
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
        setVoiceMatch(brainData.brain.voice_match_score || 0);
        setCorrectionsCount(brainData.brain.corrections_count || 0);
        setRulesCount(brainData.brain.rules?.length || 0);
        if (!brainData.brain.sample_texts || brainData.brain.sample_texts.length === 0) {
          router.push('/onboarding');
          return;
        }
      } else {
        router.push('/onboarding');
        return;
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
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-white/40 text-sm">Loading...</div></div>;
  }

  const stats = [
    { label: "Drafts este mes", value: drafts.length.toString() },
    { label: "Voice match", value: voiceMatch + "%" },
    { label: "Reglas activas", value: rulesCount.toString() },
    { label: "Correcciones", value: correctionsCount.toString() },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Generate Draft
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
            <p className="text-xs font-medium text-white/40">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-sm font-semibold text-white/70">Contenido reciente</h2>
        </div>
        <div className="divide-y divide-white/5">
          {drafts.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-white/30">
              No drafts yet. Click "Generate Draft" to create your first one.
            </div>
          ) : (
            drafts.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-white/30">{item.channel}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={"text-xs px-2 py-0.5 rounded " + (item.voice_match_score && item.voice_match_score >= 80 ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400")}>
                    {item.voice_match_score || 0}%
                  </span>
                  <span className={"rounded-full px-2.5 py-1 text-xs font-medium " + (item.status === "approved" ? "bg-green-500/10 text-green-400" : item.status === "pending" ? "bg-yellow-500/10 text-yellow-400" : "bg-white/5 text-white/40")}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0f] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Generate Draft</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
                  placeholder="e.g., Por que los builders latinos necesitan mejores herramientas"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Channel</label>
                <select
                  value={channel}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setChannel(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-purple-500/50"
                >
                  <option value="twitter">Twitter</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="substack">Substack</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Format</label>
                <select
                  value={format}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormat(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-purple-500/50"
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
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/60 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={generateDraft}
                disabled={!topic.trim() || generating}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-30"
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