"use client";

interface MorphingBlobProps {
  className?: string;
  size?: number;
  opacity?: number;
}

export default function MorphingBlob({ className = "", size = 600, opacity = 0.05 }: MorphingBlobProps) {
  return (
    <div
      className={`morphing-blob absolute pointer-events-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: `radial-gradient(circle, rgba(232,131,74,${opacity}), transparent)`,
      }}
    />
  );
}
