"use client";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-white/90 backdrop-blur-md shadow-sm" : "bg-transparent"
    }`}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="/" className="text-xl font-bold tracking-tight text-slate-900">
          Ghostwriter
        </a>
        <div className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          <a href="#brain" className="transition hover:text-slate-900">Brand Brain</a>
          <a href="#agents" className="transition hover:text-slate-900">Agents</a>
          <a href="#pricing" className="transition hover:text-slate-900">Pricing</a>
          <a href="#roi" className="transition hover:text-slate-900">ROI</a>
        </div>
        <a href="#onboarding" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
          Build my Brain
        </a>
      </nav>
    </header>
  );
}
