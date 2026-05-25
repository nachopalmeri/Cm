"use client";



import { useState } from "react";

interface Platform {
  name: string;
  connected: boolean;
  autoPublish: boolean;
  delay: string;
}

export default function DistributorPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([
    { name: "X (Twitter)", connected: true, autoPublish: true, delay: "immediate" },
    { name: "LinkedIn", connected: true, autoPublish: false, delay: "1h" },
    { name: "Substack", connected: false, autoPublish: false, delay: "4h" },
    { name: "TikTok", connected: false, autoPublish: false, delay: "24h" },
  ]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>(["draft_approved"]);

  const toggleConnection = (idx: number) => {
    setPlatforms((prev) => prev.map((p, i) => i === idx ? { ...p, connected: !p.connected } : p));
  };

  const toggleAutoPublish = (idx: number) => {
    setPlatforms((prev) => prev.map((p, i) => i === idx ? { ...p, autoPublish: !p.autoPublish } : p));
  };

  const testWebhook = () => {
    alert(`Sending test payload to ${webhookUrl}`);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Distributor Agent Configuration</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Platform Connectors</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {platforms.map((p, i) => (
            <div key={p.name} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{p.name}</h3>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.connected ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                  {p.connected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <button
                onClick={() => toggleConnection(i)}
                className={`mt-4 w-full rounded-lg py-2 text-sm font-semibold transition ${p.connected ? "border border-slate-200 text-slate-700 hover:bg-white" : "bg-brand-600 text-white hover:bg-brand-700"}`}
              >
                {p.connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Auto-Publish Rules</h2>
        <div className="mt-4 space-y-4">
          {platforms.filter((p) => p.connected).map((p, i) => (
            <div key={p.name} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Auto-publish to {p.name}</p>
                <p className="text-xs text-slate-500">Delay: {p.delay}</p>
              </div>
              <button onClick={() => toggleAutoPublish(platforms.indexOf(p))} className={`relative h-6 w-11 rounded-full transition ${p.autoPublish ? "bg-brand-600" : "bg-slate-200"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${p.autoPublish ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Webhook Configuration</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500">Webhook URL</label>
            <input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Events</label>
            <div className="mt-2 space-y-2">
              {["draft_approved", "draft_published", "correction_made"].map((event) => (
                <label key={event} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={webhookEvents.includes(event)}
                    onChange={(e) => setWebhookEvents(e.target.checked ? [...webhookEvents, event] : webhookEvents.filter((ev) => ev !== event))}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-700">{event.replace("_", " ")}</span>
                </label>
              ))}
            </div>
          </div>
          <button onClick={testWebhook} disabled={!webhookUrl} className="w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
            Test Webhook
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Transfer & Follow-up Rules</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500">Transfer to human when...</label>
            <input placeholder="Lead score > 80" className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Follow-up config</label>
            <select className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500">
              <option>Send 3 follow-ups via WhatsApp if no response</option>
              <option>Send 2 follow-ups via Email</option>
              <option>No automatic follow-up</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}