"use client";
import{useEffect,useState}from"react";
import Link from"next/link";
import{Button}from"./ui/button";
export default function Navbar(){
  const[scrolled,setScrolled]=useState(false);
  useEffect(()=>{const h=()=>setScrolled(window.scrollY>40);window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h)},[]);
  const navClass=scrolled?"bg-[#0C0A09]/90 backdrop-blur-md border-b border-white/8":"bg-transparent";
  return(
    <nav className={["fixed top-0 inset-x-0 z-50 transition-all duration-500",navClass].join(" ")}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-serif text-2xl font-bold tracking-tight text-white">GW</span>
        <div className="flex items-center gap-8">
          <Link href="#how" className="line-link text-sm text-stone-400 hover:text-[#E8834A] transition-colors hidden sm:block">Como funciona</Link>
          <Link href="#pricing" className="line-link text-sm text-stone-400 hover:text-[#E8834A] transition-colors hidden sm:block">Precios</Link>
          <Button asChild size="sm"><Link href="#tool">Proba gratis</Link></Button>
        </div>
      </div>
    </nav>
  );
}
