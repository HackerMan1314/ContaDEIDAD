import { ArrowDownCircle, ArrowUpCircle, Scale } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { GlossaryTerm } from "@/components/glossary/glossary-term";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { GlossaryKey } from "@/lib/glossary/terms";
import type { MonthlySummary } from "@/types";

interface SummaryCardsProps {
  summary: MonthlySummary;
}

/**
 * Tres tarjetas: ingresos, egresos y balance del mes seleccionado.
 * Componente presentacional (sin estado) → se renderiza en el servidor.
 */
export function SummaryCards({ summary }: SummaryCardsProps) {
  const isPositive = summary.balance >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        termKey="ingresos"
        label="Ingresos"
        value={summary.income}
        icon={<ArrowUpCircle className="h-5 w-5" />}
        accent="text-emerald-600"
        iconBg="bg-emerald-100"
      />
      <StatCard
        termKey="egresos"
        label="Egresos"
        value={summary.expense}
        icon={<ArrowDownCircle className="h-5 w-5" />}
        accent="text-rose-600"
        iconBg="bg-rose-100"
      />
      <StatCard
        termKey="balance"
        label="Balance"
        value={summary.balance}
        icon={<Scale className="h-5 w-5" />}
        accent={isPositive ? "text-emerald-600" : "text-rose-600"}
        iconBg={isPositive ? "bg-emerald-100" : "bg-rose-100"}
      />
    </div>
  );
}

interface StatCardProps {
  /** Término del glosario asociado a la etiqueta. */
  termKey: GlossaryKey;
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  iconBg: string;
}

function StatCard({ termKey, label, value, icon, accent, iconBg }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            iconBg,
            accent,
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          {/* La etiqueta es un término del glosario: muestra su definición. */}
          <GlossaryTerm termKey={termKey} className="text-sm text-zinc-500">
            {label}
          </GlossaryTerm>
          <p className={cn("truncate text-xl font-bold", accent)}>
            {formatCurrency(value)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
