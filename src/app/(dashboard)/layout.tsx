import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import type { Profile } from "@/types";

/**
 * Layout de la zona privada. El middleware ya bloquea el acceso sin sesión,
 * pero revalidamos aquí para obtener el usuario y su perfil.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Obtener perfil para mostrar el nombre del negocio en el sidebar
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const businessName = profile?.business_name ?? null;
  const fullName = profile?.full_name ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar
        email={user.email ?? ""}
        businessName={businessName}
        fullName={fullName}
        signOutAction={signOut}
      />

      {/* Main Layout Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

