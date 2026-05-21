"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={ixed top-0 inset-x-0 z-50 transition-all duration-300 }>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-serif text-2xl font-bold tracking-tight text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>GW</span>
        <div className="flex items-center gap-8">
          <Link href="#how" className="text-sm text-stone-400 hover:text-[#E8834A] transition-colors hidden sm:block">Como funciona</Link>
          <Link href="#pricing" className="text-sm text-stone-400 hover:text-[#E8834A] transition-colors hidden sm:block">Precios</Link>
          <Button asChild size="sm"><Link href="#tool">Proba gratis</Link></Button>
        </div>
      </div>
    </nav>
  );
}