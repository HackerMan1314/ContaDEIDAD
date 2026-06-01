import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Proxy de Next.js 16 (antes "middleware"). Se ejecuta antes de cada request:
 * refresca la sesión de Supabase y protege las rutas privadas.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  /**
   * Corre en todas las rutas EXCEPTO archivos estáticos, imágenes
   * optimizadas y assets, para refrescar la sesión en cada navegación de
   * página sin penalizar recursos estáticos.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
