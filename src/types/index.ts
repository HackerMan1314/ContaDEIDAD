/**
 * Tipos de dominio de ContaFácil.
 *
 * Más adelante puedes autogenerar tipos exactos desde tu BD con la CLI:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts
 * Por ahora los mantenemos a mano (sincronizados con supabase/migrations).
 */

/** Perfil del microempresario — tabla `public.profiles`. */
export interface Profile {
  id: string;
  business_name: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

/** Tipo de movimiento financiero. */
export type TransactionType = "income" | "expense";

/** Movimiento financiero — tabla `public.transactions`. */
export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: string | null;
  description: string | null;
  occurred_at: string; // formato YYYY-MM-DD
  created_at: string;
}

/** Resumen financiero de un mes concreto (clave "YYYY-MM"). */
export interface MonthlySummary {
  monthKey: string;
  income: number;
  expense: number;
  balance: number;
}
