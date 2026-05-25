import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ghostwriter — Agentic Brand System",
  description: "El sistema operativo de tu marca personal: Brand Brain, agentes de voz y ejecución multicanal con aprobación humana.",
  openGraph: {
    title: "Ghostwriter — Agentic Brand System",
    description: "Tu voz, ejecutada por agentes. De idea a contenido multicanal en segundos.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
