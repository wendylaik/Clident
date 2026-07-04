import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

/**
 * URL base del sistema. Usa la URL de Vercel en producción
 * o localhost:3000 en desarrollo.
 */
const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

/**
 * Metadatos globales del sistema para SEO y configuración del navegador.
 * Define el título, descripción y favicon de la aplicación.
 */
export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Clident",
  description: "Sistema de Gestión de Clínica Dental",
icons: [
  { rel: "icon", url: "/icon.png", type: "image/png" },
],
};

/** Fuente principal del sistema: Geist Sans de Google Fonts. */
const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});


/**
 * Layout raíz de la aplicación. Envuelve toda la aplicación con el proveedor
 * de tema (ThemeProvider) y aplica la fuente global y las clases base de Tailwind.
 *
 * @param children - Contenido de la aplicación
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
