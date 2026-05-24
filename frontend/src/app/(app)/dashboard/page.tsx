
export const metadata = {
  title: 'Dashboard | Ghostwriter',
  description: 'Manage your AI-powered brand content from a single dashboard. View drafts, analytics, and voice match scores.',
};

export default function DashboardPage() {
  const stats = [
    { label: "Drafts este mes", value: "24" },
    { label: "Voice match", value: "94%" },
    { label: "Agentes activos", value: "4" },
    { label: "Correcciones aplicadas", value: "12" },
  ];

  const recent = [
    { title: "Thread: Por qué los agentes sin memoria son autocomplete con traje", status: "approved", channel: "X" },
    { title: "Newsletter: La infraestructura de marca en 2025", status: "pending", channel: "Substack" },
    { title: "LinkedIn: Cómo escalar voz sin perder autenticidad", status: "draft", channel: "LinkedIn" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
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
          {recent.map((item) => (
            <div key={item.title} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.channel}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.status === "approved" ? "bg-green-50 text-green-700" : item.status === "pending" ? "bg-yellow-50 text-yellow-700" : "bg-slate-100 text-slate-600"}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}