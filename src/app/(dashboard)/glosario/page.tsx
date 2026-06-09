import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { GlossaryView } from "@/components/glossary/glossary-view";

export const metadata: Metadata = {
  title: "Glosario · ContaFácil",
  description: "Aprende términos financieros explicados de forma simple y en lenguaje cotidiano.",
};

export default async function GlosarioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="w-full">
      <GlossaryView userId={user.id} userEmail={user.email ?? ""} />
    </div>
  );
}
