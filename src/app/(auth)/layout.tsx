import Image from "next/image";

/**
 * Layout de la zona pública (login/registro): tarjeta centrada, mobile-first.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        {/* Marca */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <Image
              src="/logo.png"
              alt="ContaFácil Logo"
              width={150}
              height={150}
              className="h-full w-full object-contain"
              priority
            />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              ContaFácil
            </h1>
            <p className="text-sm text-zinc-500">
              Contabilidad sencilla para tu negocio
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
