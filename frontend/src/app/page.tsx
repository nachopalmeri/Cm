"use client";
import{useEffect,useRef,useState}from"react";
import Navbar from"@/components/Navbar";
import VoiceTool from"@/components/VoiceTool";

function useInView(threshold=.2){
  const ref=useRef<HTMLDivElement>(null);
  const[visible,setVisible]=useState(false);
  useEffect(()=>{const el=ref.current;if(!el)return;const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setVisible(true);o.unobserve(el)}},{threshold});o.observe(el);return()=>o.disconnect()},[threshold]);
  return{ref,visible};
}

function Section({children,className=""}:{children:React.ReactNode;className?:string}){
  const{ref,visible}=useInView();
  return<div ref={ref} className={visible?`animate-fade-slide-up ${className}`:`opacity-0 ${className}`}>{children}</div>;
}

function StepNumber({n}:{n:string}){
  return<span className="font-serif text-[120px] leading-none text-stone-800 select-none absolute -top-8 -left-4">{n}</span>;
}

export default function Home(){
  return(
    <main className="min-h-screen bg-[#0C0A09]">
      <Navbar/>

      {/*HERO*/}
      <section className="relative min-h-[90vh] flex flex-col justify-end pb-16 pt-32 px-6">
        <div className="max-w-6xl mx-auto w-full">
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Ghostwriter con memoria</p>
              <h1 className="font-serif text-[clamp(48px,8vw,120px)] leading-[0.9] tracking-tight text-white">
                Tu voz.<br/><span className="text-stone-600">Escalada.</span>
              </h1>
            </div>
            <p className="text-stone-400 text-lg max-w-xl leading-relaxed">
              Un ghostwriter AI que no escribe como robot. Aprende tu tono, respeta tu estilo, y genera contenido que suena a vos ? en cualquier plataforma.
            </p>
            <div className="flex items-center gap-6 pt-4">
              <a href="#tool" className="bg-[#E8834A] text-[#0C0A09] px-8 py-3 text-sm font-medium tracking-wide uppercase transition-all duration-300 hover:tracking-widest">Probar gratis</a>
              <a href="#how" className="line-link text-sm text-stone-400 hover:text-white transition-colors">Ver como funciona</a>
            </div>
          </div>
          <div className="mt-16 flex gap-12 text-sm">
            <div><span className="font-serif text-3xl text-white">24</span><p className="text-stone-500 mt-1">Entradas de memoria</p></div>
            <div><span className="font-serif text-3xl text-white">3</span><p className="text-stone-500 mt-1">Versiones por generacion</p></div>
            <div><span className="font-serif text-3xl text-white">0</span><p className="text-stone-500 mt-1">Prompts genericos</p></div>
          </div>
        </div>
      </section>

      {/*PROBLEM*/}
      <Section className="py-32 px-6 border-t border-stone-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-6">El problema</p>
              <h2 className="font-serif text-5xl md:text-6xl leading-tight text-white mb-8">
                Los agentes AI sin memoria son <span className="text-stone-600">autocomplete con traje.</span>
              </h2>
            </div>
            <div className="space-y-6 text-stone-400 leading-relaxed pt-4">
              <p>ChatGPT escribe bien. Pero no escribe como vos. Cada prompt es una conversacion de cero, sin contexto de lo que ya aprobaste, sin memoria de tu tono.</p>
              <p>El resultado: 47 prompts, 3 horas, y un post que suena a "blog corporativo generico numero 7".</p>
              <p>Ghostwriter es distinto. Aprende de tus correcciones. Recuerda lo que te gusto. Y la proxima vez, acierta de entrada.</p>
            </div>
          </div>
        </div>
      </Section>

      {/*HOW IT WORKS*/}
      <section id="how" className="py-32 px-6 border-t border-stone-900">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-20">Como funciona</p>
          <Section className="relative pl-20 md:pl-32 pb-24">
            <StepNumber n="01"/>
            <h3 className="font-serif text-4xl text-white mb-4">Ingesta</h3>
            <p className="text-stone-400 max-w-md leading-relaxed">Pegas tus posts, tweets, o newsletters. El sistema extrae tu voz, tono, estilo y temas recurrentes.</p>
          </Section>
          <Section className="relative pl-20 md:pl-32 pb-24">
            <StepNumber n="02"/>
            <h3 className="font-serif text-4xl text-white mb-4">Genera</h3>
            <p className="text-stone-400 max-w-md leading-relaxed">Escribis un tema. El ghostwriter genera 3 versiones distintas, cada una con tu voz, adaptada a la plataforma que elijas.</p>
          </Section>
          <Section className="relative pl-20 md:pl-32">
            <StepNumber n="03"/>
            <h3 className="font-serif text-4xl text-white mb-4">Aproba</h3>
            <p className="text-stone-400 max-w-md leading-relaxed">Aprobas, rechazas, o corregis. Cada decision alimenta la memoria. La proxima generacion sera mas precisa, mas tuya.</p>
          </Section>
        </div>
      </section>

      {/*FREE TOOL*/}
      <section id="tool" className="py-32 px-6 border-t border-stone-900">
        <div className="max-w-3xl mx-auto">
          <Section>
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-6">Herramienta gratuita</p>
            <h2 className="font-serif text-5xl text-white mb-4">Descubri tu voz</h2>
            <p className="text-stone-400 mb-12 max-w-lg">Pega 3 posts tuyos y analiza tu tono, estilo y temas en segundos. Sin registro.</p>
            <VoiceTool/>
          </Section>
        </div>
      </section>

      {/*DIFFERENTIATORS*/}
      <section className="py-32 px-6 border-t border-stone-900">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-20">Por que elegir Ghostwriter</p>
          <div className="space-y-0">
            <Section className="border-t border-stone-800 py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <span className="md:col-span-1 font-serif text-2xl text-stone-700">01</span>
              <h3 className="md:col-span-4 font-serif text-2xl text-white">Memoria persistente</h3>
              <p className="md:col-span-7 text-stone-400 leading-relaxed">No pierde contexto entre sesiones. Cada aprobacion, cada correccion, cada rechazo alimenta un perfil de voz que mejora con el tiempo.</p>
            </Section>
            <Section className="border-t border-stone-800 py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <span className="md:col-span-1 font-serif text-2xl text-stone-700">02</span>
              <h3 className="md:col-span-4 font-serif text-2xl text-white">Adaptacion por plataforma</h3>
              <p className="md:col-span-7 text-stone-400 leading-relaxed">Mismo tema, distinto formato. X pide hooks agresivos y parrafos cortos. Substack pide profundidad y narrativa.</p>
            </Section>
            <Section className="border-t border-stone-800 py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-[#E8834A]/5 -mx-6 px-6">
              <span className="md:col-span-1 font-serif text-2xl text-[#E8834A]">03</span>
              <h3 className="md:col-span-4 font-serif text-2xl text-white">Loop de feedback</h3>
              <p className="md:col-span-7 text-stone-400 leading-relaxed">Aprobas un draft? La memoria aprende. Rechazas? Aprende mas. Corregis una frase? Esa correccion pesa mas que mil ejemplos.</p>
            </Section>
            <Section className="border-t border-stone-800 py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <span className="md:col-span-1 font-serif text-2xl text-stone-700">04</span>
              <h3 className="md:col-span-4 font-serif text-2xl text-white">Privacidad total</h3>
              <p className="md:col-span-7 text-stone-400 leading-relaxed">Tu voz no entrena modelos publicos. Tu data es tuya. Borrala cuando quieras.</p>
            </Section>
          </div>
        </div>
      </section>

      {/*COMPARISON*/}
      <section className="py-32 px-6 border-t border-stone-900">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-20">Comparativa</p>
          <h2 className="font-serif text-5xl text-white mb-16">Ghostwriter vs el mercado</h2>
          <div className="space-y-0">
            {[
              {label:"Memoria de voz persistente",g:true,o:false},
              {label:"Loop de feedback con correcciones",g:true,o:false},
              {label:"Adaptacion por plataforma",g:true,o:false},
              {label:"Perfil de voz unico por usuario",g:true,o:false},
              {label:"Generacion de contenido",g:true,o:true},
              {label:"Soporte multiplataforma",g:true,o:true},
            ].map((r,i)=>(
              <Section key={i} className={`border-t border-stone-800 py-5 grid grid-cols-1 md:grid-cols-2 gap-4 ${r.g&&!r.o?'bg-[#E8834A]/5 -mx-6 px-6':''}`}>
                <span className="text-stone-300">{r.label}</span>
                <div className="flex gap-12 text-sm">
                  <span className={r.g?"text-[#E8834A]":"text-stone-600"}>{r.g?"Si":"No"}</span>
                  <span className={r.o?"text-stone-400":"text-stone-600"}>Otros: {r.o?"Si":"No"}</span>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/*PRICING*/}
      <section id="pricing" className="py-32 px-6 border-t border-stone-900">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-20">Precios</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <Section className="border border-stone-800 p-10 md:p-14">
              <h3 className="font-serif text-3xl text-white mb-2">Gratis</h3>
              <p className="text-stone-500 mb-8">Para probar la voz</p>
              <div className="font-serif text-5xl text-white mb-8">$0<span className="text-lg text-stone-500">/mes</span></div>
              <ul className="space-y-3 text-stone-400 text-sm">
                <li>Analisis de voz (herramienta gratuita)</li>
                <li>3 drafts de prueba</li>
                <li>1 plataforma</li>
              </ul>
            </Section>
            <Section className="bg-[#E8834A] p-10 md:p-14">
              <h3 className="font-serif text-3xl text-[#0C0A09] mb-2">Pro</h3>
              <p className="text-[#0C0A09]/60 mb-8">Para creadores serios</p>
              <div className="font-serif text-5xl text-[#0C0A09] mb-8">$29<span className="text-lg text-[#0C0A09]/60">/mes</span></div>
              <ul className="space-y-3 text-[#0C0A09]/80 text-sm">
                <li>Memoria ilimitada</li>
                <li>Multiplataforma (X, Substack, LinkedIn, TikTok)</li>
                <li>Loop de feedback completo</li>
                <li>Exportar drafts</li>
                <li>Soporte prioritario</li>
              </ul>
            </Section>
          </div>
        </div>
      </section>

      {/*MANIFESTO*/}
      <section className="py-48 px-6 border-t border-stone-900">
        <div className="max-w-4xl mx-auto text-center">
          <Section>
            <p className="font-serif text-4xl md:text-6xl text-white italic leading-tight">
              "La IA no deberia sonar a IA. Deberia sonar a vos."
            </p>
          </Section>
        </div>
      </section>

      {/*FOOTER*/}
      <footer className="py-12 px-6 border-t border-stone-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-serif text-xl text-white">GW</span>
          <div className="flex gap-8 text-sm text-stone-500">
            <a href="#" className="line-link hover:text-stone-300 transition-colors">Twitter</a>
            <a href="#" className="line-link hover:text-stone-300 transition-colors">GitHub</a>
            <a href="#" className="line-link hover:text-stone-300 transition-colors">Contacto</a>
          </div>
          <span className="text-xs text-stone-600">2025 Ghostwriter</span>
        </div>
      </footer>
    </main>
  );
}
