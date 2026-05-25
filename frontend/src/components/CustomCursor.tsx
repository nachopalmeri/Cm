"use client";
import { useEffect, useState } from "react";

export function CustomCursor() {
  const [p, setP] = useState({ x: -100, y: -100 });
  const [h, setH] = useState(false);
  useEffect(() => {
    const m = (e: MouseEvent) => setP({ x: e.clientX, y: e.clientY });
    const o = (e: MouseEvent) => setH(!!(e.target as HTMLElement).closest("a,button,[role=button]"));
    window.addEventListener("mousemove", m);
    document.addEventListener("mouseover", o);
    return () => { window.removeEventListener("mousemove", m); document.removeEventListener("mouseover", o); };
  }, []);
  return <div className={`custom-cursor${h?" hover-btn":""}`} style={{ left: p.x - 5, top: p.y - 5 }} />;
}
