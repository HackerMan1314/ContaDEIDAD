import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Crear cuenta · ContaFácil",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-zinc-900">Crea tu cuenta</h2>
        <p className="text-sm text-zinc-500">
          Empieza a llevar la contabilidad de tu microempresa en minutos.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
