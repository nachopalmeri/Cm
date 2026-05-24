"use client";



export default function AnalyticsPage() {
  const voiceMatchHistory = [
    { week: "Sem 1", value: 85 },
    { week: "Sem 2", value: 91 },
    { week: "Sem 3", value: 94 },
    { week: "Sem 4", value: 97 },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>

      <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-600">Time Saved This Month</p>
            <p className="mt-2 text-5xl font-bold text-slate-900">42 horas</p>
            <p className="mt-1 text-sm text-slate-600">vs 160h de redacción manual</p>
          </div>
          <div className="rounded-2xl bg-white px-8 py-6 text-center shadow-sm">
            <p className="text-4xl font-bold text-brand-600">120x</p>
            <p className="text-xs text-slate-500">más rápido</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Voice Match Evolution</h2>
          <div className="mt-6 space-y-3">
            {voiceMatchHistory.map((item) => (
              <div key={item.week}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.week}</span>
                  <span className="font-bold text-slate-900">{item.value}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-brand-600 transition-all" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-lg bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-900">Proyección: 99% en 2 semanas</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Content Metrics</h2>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-3xl font-bold text-slate-900">24</p>
              <p className="mt-1 text-xs text-slate-500">Drafts generados</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-3xl font-bold text-green-700">18</p>
              <p className="mt-1 text-xs text-green-600">Aprobados (75%)</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <p className="text-3xl font-bold text-red-700">3</p>
              <p className="mt-1 text-xs text-red-600">Rechazados (12.5%)</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4 text-center">
              <p className="text-3xl font-bold text-yellow-700">3</p>
              <p className="mt-1 text-xs text-yellow-600">En revisión (12.5%)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Platform Distribution</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            { platform: "X", percentage: 40, color: "bg-blue-500" },
            { platform: "LinkedIn", percentage: 30, color: "bg-indigo-500" },
            { platform: "Substack", percentage: 20, color: "bg-orange-500" },
            { platform: "TikTok", percentage: 10, color: "bg-pink-500" },
          ].map((item) => (
            <div key={item.platform} className="text-center">
              <div className="mx-auto h-24 w-24 rounded-full border-8 border-slate-100 flex items-center justify-center" style={{ borderTopColor: item.color.replace("bg-", ""), borderRightColor: item.color.replace("bg-", "") }}>
                <span className="text-2xl font-bold text-slate-900">{item.percentage}%</span>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-700">{item.platform}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Corrections Impact</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-brand-50 p-5">
            <p className="text-sm font-medium text-brand-900">12 correcciones aplicadas</p>
            <p className="mt-1 text-xs text-brand-600">→ 8 reglas nuevas aprendidas</p>
          </div>
          <div className="rounded-lg bg-green-50 p-5">
            <p className="text-sm font-medium text-green-900">Voice match subió 9% este mes</p>
            <p className="mt-1 text-xs text-green-600">De 85% a 94%</p>
          </div>
        </div>
      </div>
    </div>
  );
}