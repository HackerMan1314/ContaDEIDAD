import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para componentes del navegador ('use client').
 * Lee/escribe la sesión en cookies para que sea compartida con el servidor.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
