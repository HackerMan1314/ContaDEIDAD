import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión · ContaFácil",
};

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-zinc-900">Inicia sesión</h2>
        <p className="text-sm text-zinc-500">
          Accede para administrar las finanzas de tu negocio.
        </p>
      </div>
      {/* LoginForm usa useSearchParams, por eso va dentro de Suspense. */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
