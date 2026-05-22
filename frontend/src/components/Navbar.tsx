"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white border-b border-[#E0E0E0]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-sans font-bold text-[#0D0D0D] text-base tracking-tight"
        >
          Ghostwriter OS
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6 text-sm">
          <Link
            href="#pipeline"
            className="text-[#7A7A7A] hover:text-[#0D0D0D] transition-colors hidden md:block"
          >
            Sistema
          </Link>
          <Link
            href="#simulator"
            className="text-[#7A7A7A] hover:text-[#0D0D0D] transition-colors hidden md:block"
          >
            Simulador
          </Link>
          <Link
            href="#memory"
            className="text-[#7A7A7A] hover:text-[#0D0D0D] transition-colors hidden md:block"
          >
            Memoria
          </Link>
          <Link
            href="#voicelab"
            className="text-[#7A7A7A] hover:text-[#0D0D0D] transition-colors hidden md:block"
          >
            Demo
          </Link>
          <a
            href="#cta"
            className="rounded-full bg-[#0D0D0D] text-white px-4 py-2 text-sm hover:bg-[#3A3A3A] transition-colors"
          >
            Solicitar acceso
          </a>
        </div>
      </div>
    </nav>
  );
}
