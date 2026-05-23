import type { Metadata } from "next";
import { SmoothScroll } from "@/components/SmoothScroll";
import { CustomCursor } from "@/components/CustomCursor";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ghostwriter ? Escribe como vos. A escala.",
  description: "Un sistema que aprende tu voz, recuerda tus correcciones, y genera contenido que suena a vos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-background text-primary antialiased">
        <CustomCursor />
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
