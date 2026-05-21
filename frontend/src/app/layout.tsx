import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ghostwriter — Tu voz. Tu memoria. Cada vez.",
  description: "El único ghostwriter AI con memoria persistente. Genera contenido para X, LinkedIn y Substack que suena exactamente como vos.",
  openGraph: {
    title: "Ghostwriter AI",
    description: "Contenido que suena como vos. Memoria que mejora con cada draft.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}