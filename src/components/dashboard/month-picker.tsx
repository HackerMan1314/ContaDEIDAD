"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { addMonths, getCurrentMonthKey } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
  /** Mes seleccionado en formato "YYYY-MM". */
  selectedMonth: string;
}

/**
 * Selector de mes. Cambia el query param `?month=YYYY-MM`, lo que provoca un
 * re-render del Server Component del dashboard con los datos del nuevo mes.
 * No permite navegar a meses futuros.
 */
export function MonthPicker({ selectedMonth }: MonthPickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentMonth = getCurrentMonthKey();
  const isAtCurrentMonth = selectedMonth >= currentMonth;

  function goToMonth(monthKey: string) {
    if (monthKey > currentMonth) return; // sin meses futuros
    router.push(`${pathname}?month=${monthKey}`);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => goToMonth(addMonths(selectedMonth, -1))}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-600 transition-colors hover:bg-zinc-50"
        aria-label="Mes anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Input nativo de mes: salto directo + UX móvil. */}
      <input
        type="month"
        value={selectedMonth}
        max={currentMonth}
        onChange={(e) => e.target.value && goToMonth(e.target.value)}
        className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        aria-label="Seleccionar mes"
      />

      <button
        type="button"
        onClick={() => goToMonth(addMonths(selectedMonth, 1))}
        disabled={isAtCurrentMonth}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-600 transition-colors hover:bg-zinc-50",
          isAtCurrentMonth && "cursor-not-allowed opacity-40 hover:bg-white",
        )}
        aria-label="Mes siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
