"use client";



import { useState } from "react";

export default function VoicePage() {
  const [name, setName] = useState("Founder Voice Agent");
  const [purpose, setPurpose] = useState("Calificación de leads, contenido educativo");
  const [language, setLanguage] = useState("es-LATAM");
  const [accent, setAccent] = useState("neutral");
  const [speed, setSpeed] = useState(1);
  const [temperature, setTemperature] = useState(0.5);
  const [background, setBackground] = useState("none");
  const [interruption, setInterruption] = useState("medium");
  const [files, setFiles] = useState<string[]>([]);

  const testVoice = () => {
    alert(`Testing voice: ${name} (${accent}, ${speed}x speed, temp ${temperature})`);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Voice Agent Configuration</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Identity</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500">Nombre del agente</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Propósito</label>
              <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} className="mt-1 min-h-20 w-full resize-none rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Idioma</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500">
                <option value="es-LATAM">Español LATAM</option>
                <option value="en-US">English US</option>
                <option value="pt-BR">Português BR</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Voice Settings</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500">Acento</label>
              <select value={accent} onChange={(e) => setAccent(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500">
                <option value="neutral">Neutral</option>
                <option value="paisa">Paisa (Colombia)</option>
                <option value="mexicano">Mexicano</option>
                <option value="argentino">Argentino</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Velocidad: {speed}x</label>
              <input type="range" min="0.5" max="2" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="mt-2 w-full" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Temperatura: {temperature} {temperature < 0.3 ? "(estricto)" : temperature > 0.6 ? "(creativo)" : "(balanceado)"}</label>
              <input type="range" min="0" max="0.8" step="0.05" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="mt-2 w-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Brain Upload</h2>
        <p className="mt-2 text-sm text-slate-600">Carga PDFs, Excel o Word para que el agente maneje objeciones y detalles técnicos.</p>
        <div className="mt-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <input type="file" multiple className="hidden" id="brain-upload" onChange={(e) => setFiles(Array.from(e.target.files || []).map((f) => f.name))} />
          <label htmlFor="brain-upload" className="cursor-pointer">
            <div className="mx-auto h-12 w-12 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">Drag & drop o click para subir</p>
            <p className="mt-1 text-xs text-slate-500">PDF, XLSX, DOCX hasta 10MB</p>
          </label>
        </div>
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2">
                <span className="text-sm text-slate-700">{f}</span>
                <button className="text-xs text-red-600 hover:text-red-700">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Humanization</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-500">Sonido de fondo</label>
            <select value={background} onChange={(e) => setBackground(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500">
              <option value="none">Ninguno</option>
              <option value="callcenter">Call center</option>
              <option value="cafe">Cafetería</option>
              <option value="office">Oficina</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Sensibilidad de interrupción</label>
            <select value={interruption} onChange={(e) => setInterruption(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>
        </div>
      </div>

      <button onClick={testVoice} className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700">
        Test Voice
      </button>
    </div>
  );
}