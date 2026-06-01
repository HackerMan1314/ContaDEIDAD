import type { MonthlySummary, Transaction } from "@/types";

/** La clave de mes ("YYYY-MM") de una transacción según su fecha. */
function transactionMonthKey(t: Transaction): string {
  return t.occurred_at.slice(0, 7);
}

/**
 * Resume los ingresos, egresos y balance de un mes concreto a partir de una
 * lista de transacciones.
 */
export function summarizeMonth(
  transactions: Transaction[],
  monthKey: string,
): MonthlySummary {
  let income = 0;
  let expense = 0;

  for (const t of transactions) {
    if (transactionMonthKey(t) !== monthKey) continue;
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }

  return { monthKey, income, expense, balance: income - expense };
}

/**
 * Genera un resumen por cada mes de `monthKeys` (útil para el gráfico).
 * Recorre las transacciones una sola vez: O(transacciones), no O(meses×tx).
 */
export function summarizeByMonth(
  transactions: Transaction[],
  monthKeys: string[],
): MonthlySummary[] {
  const map = new Map<string, MonthlySummary>(
    monthKeys.map((key) => [
      key,
      { monthKey: key, income: 0, expense: 0, balance: 0 },
    ]),
  );

  for (const t of transactions) {
    const summary = map.get(transactionMonthKey(t));
    if (!summary) continue; // fuera del rango pedido
    if (t.type === "income") summary.income += t.amount;
    else summary.expense += t.amount;
  }

  // Calcula el balance y respeta el orden de monthKeys.
  return monthKeys.map((key) => {
    const s = map.get(key)!;
    return { ...s, balance: s.income - s.expense };
  });
}
