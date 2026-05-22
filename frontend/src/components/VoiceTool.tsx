"use client";
import{useState}from"react";
export default function VoiceTool(){
  const[text,setText]=useState("");
  const[result,setResult]=useState<{tone:string;style:string;topics:string;hook:string}|null>(null);
  const[loading,setLoading]=useState(false);
  const analyze=()=>{if(!text.trim())return;setLoading(true);setTimeout(()=>{
    const words=text.split(/\s+/);const sentences=text.split(/[.!?]+/).filter(Boolean);
    const avg=words.length/Math.max(sentences.length,1);
    const tone=avg<12?"directo, sin filtro":avg<20?"balanceado, explicativo":"profundo, academico";
    const style=text.includes("?")&&text.includes("!")?"interrogativo-energico":text.includes("-")?"narrativo en bloques":"conversacional fluido";
    const first=sentences[0]?.trim()||"";
    setResult({tone,style,topics:"growth, producto, mindset",hook:first.length>60?first.slice(0,60)+"...":first});
    setLoading(false);
  },1800)};
  return(
    <div className="space-y-8">
      <div className="relative">
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Pega aca 3 posts tuyos..."
          className="w-full h-48 bg-transparent border-b border-stone-700 text-stone-200 placeholder:text-stone-600 focus:border-[#E8834A] focus:outline-none resize-none text-base leading-relaxed"/>
        <div className="absolute bottom-4 right-0 text-xs text-stone-600">{text.length} chars</div>
      </div>
      <button onClick={analyze} disabled={loading} className="bg-[#E8834A] text-[#0C0A09] px-8 py-3 text-sm font-medium tracking-wide uppercase transition-all duration-300 hover:tracking-widest">{loading?"Analizando voz...":"Descubri tu voz"}</button>
      {result&&(
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 animate-fade-slide-up">
          <div className="border-t border-stone-800 py-6"><span className="text-[10px] uppercase tracking-[0.3em] text-stone-600 block mb-2">Tono</span><p className="text-stone-200 font-serif text-lg">{result.tone}</p></div>
          <div className="border-t border-stone-800 py-6 sm:pl-8"><span className="text-[10px] uppercase tracking-[0.3em] text-stone-600 block mb-2">Estilo</span><p className="text-stone-200 font-serif text-lg">{result.style}</p></div>
          <div className="border-t border-stone-800 py-6"><span className="text-[10px] uppercase tracking-[0.3em] text-stone-600 block mb-2">Temas</span><p className="text-stone-200 font-serif text-lg">{result.topics}</p></div>
          <div className="border-t border-stone-800 py-6 sm:pl-8"><span className="text-[10px] uppercase tracking-[0.3em] text-stone-600 block mb-2">Hook tipico</span><p className="text-stone-200 font-serif text-lg italic">&ldquo;{result.hook}&rdquo;</p></div>
        </div>
      )}
    </div>
  );
}
