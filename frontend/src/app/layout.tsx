import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ghostwriter OS — Sistema editorial multiagente",
  description:
    "Pipeline editorial con estratega, writer, editor, aprobación humana y memoria persistente para crear contenido con tu voz.",
  openGraph: {
    title: "Ghostwriter OS",
    description:
      "De brief a contenido aprobado con memoria y control humano en el loop.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
