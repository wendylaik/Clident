import { createBrowserClient } from "@supabase/ssr";

/**
 * Crea un cliente de Supabase para usar en componentes del navegador ("use client").
 * Lee las variables de entorno públicas para conectarse al proyecto de Supabase.
 * Maneja automáticamente las cookies de sesión en el lado del cliente.
 * @returns Cliente de Supabase configurado para el navegador
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
