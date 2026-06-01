"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Cierra la sesión del usuario y lo manda al login. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
