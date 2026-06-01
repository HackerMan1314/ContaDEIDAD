/**
 * Helpers de formato y de fechas para el dashboard.
 *
 * Las "claves de mes" son strings "YYYY-MM" (ej. "2026-06"). Trabajamos con
 * strings en vez de objetos Date para evitar errores de zona horaria, ya que
 * `occurred_at` viene como "YYYY-MM-DD" desde Postgres.
 */

const LOCALE = "es-MX";
const CURRENCY = "MXN";

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** Formatea un número como moneda: 1234.5 -> "$1,234.50". */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(amount);
}

/** Versión compacta para ejes de gráficos: 1500 -> "$1.5k". */
export function formatCompactCurrency(amount: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

/** Clave del mes actual, ej. "2026-06". */
export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Suma `delta` meses a una clave (acepta negativos). "2026-01" + (-1) = "2025-12". */
export function addMonths(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const total = year * 12 + (month - 1) + delta;
  const newYear = Math.floor(total / 12);
  const newMonth = (total % 12) + 1;
  return `${newYear}-${String(newMonth).padStart(2, "0")}`;
}

/**
 * Devuelve `count` claves de mes que TERMINAN (inclusive) en `endKey`,
 * ordenadas de la más antigua a la más reciente.
 * previousMonths("2026-06", 3) => ["2026-04", "2026-05", "2026-06"]
 */
export function previousMonths(endKey: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    addMonths(endKey, -(count - 1 - i)),
  );
}

/** "2026-06" -> "Junio 2026". */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${MONTHS_ES[month - 1]} ${year}`;
}

/** "2026-06" -> "Jun 26" (para ejes compactos del gráfico). */
export function formatMonthShort(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${MONTHS_ES[month - 1].slice(0, 3)} ${String(year).slice(2)}`;
}
