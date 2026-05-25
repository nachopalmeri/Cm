"use client";
import { useEffect, useState } from "react";

export default function Mascot() {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
      setTimeout(blink, 4000 + Math.random() * 2000);
    };
    const timer = setTimeout(blink, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mascot animate-float">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" stroke="#E8834A" fill="none" strokeWidth="2.5"/>
        <text x="50" y="62" textAnchor="middle" className="font-serif text-[28px] fill-[#E8834A] select-none">GW</text>
        {!isBlinking && (
          <>
            <circle cx="35" cy="38" r="2.5" fill="#E8834A"/>
            <circle cx="65" cy="38" r="2.5" fill="#E8834A"/>
          </>
        )}
      </svg>
    </div>
  );
}
