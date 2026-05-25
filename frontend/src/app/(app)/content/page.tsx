export default function ContentPage() {
  const drafts = [
    { title: "Por qué los agentes sin memoria son autocomplete con traje", channel: "X", status: "approved", date: "Hoy" },
    { title: "La infraestructura de marca en 2025", channel: "Substack", status: "pending", date: "Ayer" },
    { title: "Cómo escalar voz sin perder autenticidad", channel: "LinkedIn", status: "draft", date: "2 días" },
    { title: "Speed to Content: de 40h a 2h semanales", channel: "TikTok script", status: "draft", date: "3 días" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Content</h1>
        <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
          + Nuevo draft
        </button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Todos los drafts</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {drafts.map((d) => (
            <div key={d.title} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{d.title}</p>
                <p className="text-xs text-slate-500">{d.channel} · {d.date}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${d.status === "approved" ? "bg-green-50 text-green-700" : d.status === "pending" ? "bg-yellow-50 text-yellow-700" : "bg-slate-100 text-slate-600"}`}>
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}