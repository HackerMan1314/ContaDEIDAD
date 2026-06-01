import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Profile } from "@/types";

export const metadata: Metadata = {
  title: "Mi perfil · ContaFácil",
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Gracias a RLS, esta consulta solo puede devolver el perfil del propio usuario.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  // Respaldo por si el perfil aún no existe (usuario previo al trigger).
  const safeProfile: Profile = profile ?? {
    id: user.id,
    business_name: null,
    full_name: null,
    phone: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Mi perfil
        </h1>
        <p className="text-zinc-600">
          Completa los datos de tu negocio.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del negocio</CardTitle>
          <CardDescription>
            Esta información identifica a tu microempresa dentro de ContaFácil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={safeProfile} email={user.email ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
