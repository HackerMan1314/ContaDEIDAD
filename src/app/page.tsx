import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Punto de entrada: si hay sesión va al dashboard, si no, al login.
 * (El middleware ya protege rutas; esto define la raíz "/").
 */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}
