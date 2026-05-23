"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "bg-background/80 backdrop-blur-xl border-b border-white/5" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-primary tracking-tight">Ghostwriter</Link>
        <div className="flex items-center gap-8">
          <Link href="#how" className="text-sm text-muted hover:text-primary transition-colors hidden sm:block">Como funciona</Link>
          <Link href="#pricing" className="text-sm text-muted hover:text-primary transition-colors hidden sm:block">Precios</Link>
          <Link href="#tool" className="bg-surface border border-white/10 text-primary px-5 py-2 rounded-full text-sm hover:bg-surface/80 transition-all">Probar gratis</Link>
        </div>
      </div>
    </nav>
  );
}
