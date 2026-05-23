"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Mascot from "./Mascot";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12">
            <Mascot />
          </div>
          <Link href="/" className="font-serif text-xl text-white tracking-tight">Ghostwriter</Link>
        </div>
        <div className="flex items-center gap-8">
          <Link href="#how" className="line-link text-sm text-white/30 hover:text-white transition-colors hidden sm:block">Como funciona</Link>
          <Link href="#pricing" className="line-link text-sm text-white/30 hover:text-white transition-colors hidden sm:block">Precios</Link>
          <Link href="#tool" className="bg-white/5 border border-white/10 text-white px-5 py-2 rounded-full text-sm hover:bg-white/10 transition-all">
            Probar gratis
          </Link>
        </div>
      </div>
    </nav>
  );
}
