"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/auth/supabase-browser';

export default function SettingsPage() {
  const [plan, setPlan] = useState('free');
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      // Plan will be fetched from profiles once column exists
    });
  }, []);

  const handleUpgrade = async (planType: string) => {
    setLoadingCheckout(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planType })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast('Error al crear checkout');
      }
    } catch (e) {
      showToast('Error al conectar con Stripe');
    } finally {
      setLoadingCheckout(false);
    }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const plans = [
    { id: 'free', name: 'Free', price: '$0/mes', features: ['5 drafts/mes', '1 Brand Brain', 'Voice learning basico'], current: plan === 'free' },
    { id: 'starter', name: 'Starter', price: '$12/mes', features: ['50 drafts/mes', '1 Brand Brain', 'Voice learning avanzado', 'Editor agent'], current: plan === 'starter' },
    { id: 'pro', name: 'Pro', price: '$29/mes', features: ['Drafts ilimitados', 'Brand Brains ilimitados', 'Auto-review', 'Priority support'], current: plan === 'pro' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <div className="max-w-3xl space-y-6">
        {/* Current Plan */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-white/70">Plan actual</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {plans.map((p) => (
              <div key={p.id} className={"rounded-lg border p-4 " + (p.current ? "border-purple-500/30 bg-purple-500/5" : "border-white/10 bg-white/[0.02]")}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                  {p.current && <span className="text-xs text-purple-400">Actual</span>}
                </div>
                <p className="mt-1 text-lg font-bold text-white">{p.price}</p>
                <ul className="mt-3 space-y-1">
                  {p.features.map((f) => (
                    <li key={f} className="text-xs text-white/40">&#10003; {f}</li>
                  ))}
                </ul>
                {!p.current && p.id !== 'free' && (
                  <button
                    onClick={() => handleUpgrade(p.id)}
                    disabled={loadingCheckout}
                    className="mt-4 w-full rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-30"
                  >
                    {loadingCheckout ? 'Procesando...' : 'Upgrade'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Integrations — Coming Soon */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-white/70">Integraciones</h2>
          <div className="mt-4 space-y-3">
            {['X (Twitter)', 'LinkedIn', 'Substack'].map((name) => (
              <div key={name} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                <span className="text-sm text-white/50">{name}</span>
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-white/30">Coming soon</span>
              </div>
            ))}
          </div>
        </div>

        {/* Autonomy Mode — Coming Soon */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white/70">Autonomy Mode</h2>
              <p className="mt-1 text-xs text-white/30">Auto-publish drafts sin revision manual</p>
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-white/30">Coming soon</span>
          </div>
          <div className="mt-4 rounded-lg border border-yellow-500/10 bg-yellow-500/5 p-4">
            <p className="text-xs text-yellow-400/70">Requiere Voice Match &gt;= 95% y plan Pro</p>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-lg border border-white/10 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}