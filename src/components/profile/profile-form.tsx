"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { profileSchema, type ProfileValues } from "@/lib/validations/profile";
import type { Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileFormProps {
  profile: Profile;
  /** Correo del usuario (de auth, no editable aquí). */
  email: string;
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      business_name: profile.business_name ?? "",
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
    },
  });

  async function onSubmit(values: ProfileValues) {
    setServerError(null);
    setSaved(false);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        business_name: values.business_name,
        full_name: values.full_name,
        phone: values.phone || null,
      })
      .eq("id", profile.id); // RLS además garantiza que solo sea la fila propia.

    if (error) {
      setServerError(error.message);
      return;
    }

    setSaved(true);
    router.refresh(); // refresca los Server Components con los datos nuevos.
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
    >
      {/* Correo (solo lectura) */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" type="email" value={email} disabled />
        <p className="text-xs text-zinc-400">
          El correo se gestiona desde tu cuenta y no puede cambiarse aquí.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="business_name">Nombre del negocio *</Label>
        <Input
          id="business_name"
          placeholder="Ej. Panadería La Espiga"
          aria-invalid={!!errors.business_name}
          {...register("business_name")}
        />
        {errors.business_name && (
          <p className="text-xs text-red-600">{errors.business_name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="full_name">Nombre del responsable *</Label>
        <Input
          id="full_name"
          placeholder="Ej. María González"
          aria-invalid={!!errors.full_name}
          {...register("full_name")}
        />
        {errors.full_name && (
          <p className="text-xs text-red-600">{errors.full_name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="Ej. +52 55 1234 5678"
          aria-invalid={!!errors.phone}
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-xs text-red-600">{errors.phone.message}</p>
        )}
      </div>

      {serverError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
        {saved && !isDirty && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <Check className="h-4 w-4" />
            Guardado
          </span>
        )}
      </div>
    </form>
  );
}
