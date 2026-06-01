import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { summarizeByMonth, summarizeMonth } from "@/lib/finance";
import {
  addMonths,
  formatMonthLabel,
  formatMonthShort,
  getCurrentMonthKey,
  previousMonths,
} from "@/lib/format";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import {
  MonthlyChart,
  type MonthlyChartDatum,
} from "@/components/dashboard/monthly-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlossaryTerm } from "@/components/glossary/glossary-term";
import type { Transaction } from "@/types";

export const metadata: Metadata = {
  title: "Resumen · ContaFácil",
};

/** Nº de meses que muestra el gráfico de evolución. */
const CHART_MONTHS = 6;
const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export default async function DashboardPage({
  searchParams,
}: {
  // En Next.js 15+ searchParams es asíncrono.
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1) Mes seleccionado: del query param si es válido, si no el mes actual.
  const { month } = await searchParams;
  const currentMonth = getCurrentMonthKey();
  const selectedMonth =
    month && MONTH_KEY_REGEX.test(month) && month <= currentMonth
      ? month
      : currentMonth;

  // 2) Ventana de fechas: los últimos CHART_MONTHS meses hasta el seleccionado.
  const months = previousMonths(selectedMonth, CHART_MONTHS); // antiguo -> reciente
  const rangeStart = `${months[0]}-01`;
  const rangeEnd = `${addMonths(selectedMonth, 1)}-01`; // exclusivo

  // 3) Una sola consulta (RLS limita a las filas del propio usuario).
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .gte("occurred_at", rangeStart)
    .lt("occurred_at", rangeEnd)
    .order("occurred_at", { ascending: true })
    .returns<Transaction[]>();

  const rows = transactions ?? [];

  // 4) Agregaciones para tarjetas y gráfico.
  const summary = summarizeMonth(rows, selectedMonth);
  const series = summarizeByMonth(rows, months);
  const chartData: MonthlyChartDatum[] = series.map((s) => ({
    month: formatMonthShort(s.monthKey),
    Ingresos: s.income,
    Egresos: s.expense,
    Balance: s.balance,
  }));

  const hasData = rows.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado + selector de mes */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Resumen financiero
          </h1>
          <p className="text-zinc-600">{formatMonthLabel(selectedMonth)}</p>
        </div>
        <MonthPicker selectedMonth={selectedMonth} />
      </div>

      {!hasData && (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-500">
          No hay movimientos en este rango. Si aún no generaste datos de prueba,
          ejecuta la función <code className="text-zinc-700">seed_transactions</code>{" "}
          del archivo <code className="text-zinc-700">0002_transactions.sql</code>.
        </p>
      )}

      {/* Tarjetas de resumen (Tarea #13) */}
      <SummaryCards summary={summary} />

      {/* Gráfico mensual (Tarea #14) */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución de los últimos {CHART_MONTHS} meses</CardTitle>
          <CardDescription>
            Visualiza tu{" "}
            <GlossaryTerm termKey="flujoEfectivo" showIcon={false}>
              flujo de efectivo
            </GlossaryTerm>{" "}
            mes a mes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
}
