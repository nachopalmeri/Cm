"use client";
import { useEffect, useState, ReactNode } from "react";

interface ParallaxLayerProps {
  speed: number;
  children: ReactNode;
  className?: string;
}

export default function ParallaxLayer({ speed, children, className = "" }: ParallaxLayerProps) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY * speed);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return (
    <div
      className={`parallax-slow ${className}`}
      style={{ transform: `translateY(${offset}px)` }}
    >
      {children}
    </div>
  );
}
