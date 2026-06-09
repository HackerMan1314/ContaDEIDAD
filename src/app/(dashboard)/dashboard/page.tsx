import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Percent,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { summarizeByMonth, summarizeMonth } from "@/lib/finance";
import {
  addMonths,
  formatMonthLabel,
  formatMonthShort,
  getCurrentMonthKey,
  previousMonths,
  formatCurrency,
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
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Resumen · ContaFácil",
};

/** Nº de meses que muestra el gráfico de evolución. */
const CHART_MONTHS = 6;
const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export default async function DashboardPage({
  searchParams,
}: {
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

  // 3) Consulta de transacciones
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .gte("occurred_at", rangeStart)
    .lt("occurred_at", rangeEnd)
    .order("occurred_at", { ascending: true })
    .returns<Transaction[]>();

  const rows = transactions ?? [];
  const hasData = rows.length > 0;

  // 4) Agregaciones para tarjetas y gráfico
  const summary = summarizeMonth(rows, selectedMonth);
  const series = summarizeByMonth(rows, months);
  const chartData: MonthlyChartDatum[] = series.map((s) => ({
    month: formatMonthShort(s.monthKey),
    Ingresos: s.income,
    Egresos: s.expense,
    Balance: s.balance,
  }));

  // 5) Transacciones del mes seleccionado (para el desglose y recientes)
  const selectedMonthTransactions = rows.filter((t) =>
    t.occurred_at.startsWith(selectedMonth)
  );

  // Egresos por categoría
  const expenses = selectedMonthTransactions.filter((t) => t.type === "expense");
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  const expenseByCategoryMap = new Map<string, number>();
  for (const t of expenses) {
    const cat = t.category || "Otros";
    expenseByCategoryMap.set(cat, (expenseByCategoryMap.get(cat) || 0) + t.amount);
  }

  const expenseByCategory = Array.from(expenseByCategoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Transacciones recientes (últimas 5)
  const recentTransactions = [...selectedMonthTransactions]
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at) || b.created_at.localeCompare(a.created_at))
    .slice(0, 5);

  // 6) Indicadores de Salud Financiera
  // Margen de utilidad: (Balance / Ingresos) * 100
  const profitMargin =
    summary.income > 0 ? (summary.balance / summary.income) * 100 : 0;

  // Relación Egresos / Ingresos
  const expenseToIncomeRatio =
    summary.income > 0 ? (summary.expense / summary.income) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado + selector de mes */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Activity className="h-8 w-8 text-emerald-600 animate-pulse" />
            Resumen Financiero
          </h1>
          <p className="text-slate-600 mt-1 text-sm md:text-base font-medium">
            Monitorea los ingresos, egresos y la salud financiera de tu negocio en {formatMonthLabel(selectedMonth)}.
          </p>
        </div>
        <MonthPicker selectedMonth={selectedMonth} />
      </div>

      {!hasData && (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center">
          <p className="text-sm text-zinc-500 mb-3">
            No hay movimientos registrados en este rango. Si aún no tienes datos,
            puedes sembrarlos o agregar una transacción manualmente.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/transacciones"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
            >
              Agregar transacción
            </Link>
          </div>
        </div>
      )}

      {hasData && (
        <>
          {/* Tarjetas de resumen (Ingresos, Egresos, Balance) */}
          <SummaryCards summary={summary} />

          {/* Grid Principal del Dashboard */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Columna Izquierda: Gráfico y Transacciones Recientes (Col-span 2) */}
            <div className="space-y-6 lg:col-span-2">
              {/* Gráfico de Evolución */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-zinc-800">Evolución Mensual</CardTitle>
                  <CardDescription>
                    Visualiza tu{" "}
                    <GlossaryTerm termKey="flujoEfectivo" showIcon={false}>
                      flujo de efectivo
                    </GlossaryTerm>{" "}
                    durante los últimos {CHART_MONTHS} meses.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MonthlyChart data={chartData} />
                </CardContent>
              </Card>

              {/* Transacciones Recientes */}
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-zinc-800">Actividad Reciente</CardTitle>
                    <CardDescription>Últimos movimientos registrados en el mes.</CardDescription>
                  </div>
                  <Link
                    href="/transacciones"
                    className="group flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Ver todas
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-zinc-100">
                    {recentTransactions.length === 0 ? (
                      <p className="px-6 py-6 text-sm text-zinc-500 text-center">
                        No hay movimientos registrados para este mes.
                      </p>
                    ) : (
                      recentTransactions.map((tx) => {
                        const isIncome = tx.type === "income";
                        return (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={cn(
                                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                  isIncome ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                )}
                              >
                                {isIncome ? (
                                  <ArrowUpRight className="h-4.5 w-4.5" />
                                ) : (
                                  <ArrowDownRight className="h-4.5 w-4.5" />
                                )}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-zinc-800">
                                  {tx.description || "Sin descripción"}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                                  <span className="truncate">{tx.category || "General"}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5">
                                    <Calendar className="h-3 w-3" />
                                    {tx.occurred_at}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span
                              className={cn(
                                "text-sm font-bold whitespace-nowrap",
                                isIncome ? "text-emerald-600" : "text-rose-600"
                              )}
                            >
                              {isIncome ? "+" : "-"}
                              {formatCurrency(tx.amount)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Columna Derecha: Indicadores y Distribución de Egresos (Col-span 1) */}
            <div className="space-y-6 lg:col-span-1">
              {/* Indicadores de Salud Financiera */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-zinc-800">Indicadores Clave</CardTitle>
                  <CardDescription>Métricas de rendimiento de tu negocio.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Margen de Utilidad */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <GlossaryTerm
                        termKey="utilidad"
                        className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
                      >
                        Margen de Utilidad
                      </GlossaryTerm>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                          profitMargin >= 20
                            ? "bg-emerald-50 text-emerald-700"
                            : profitMargin > 0
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        )}
                      >
                        {profitMargin >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {profitMargin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-zinc-900">
                        {formatCurrency(summary.balance)}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">neto</span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {profitMargin >= 20
                        ? "¡Excelente rentabilidad! Tu negocio retiene un buen porcentaje de ingresos."
                        : profitMargin > 0
                        ? "Rentabilidad moderada. Considera optimizar algunos egresos."
                        : "Tu negocio opera bajo pérdidas este mes. Revisa tus gastos."}
                    </p>
                  </div>

                  <hr className="border-zinc-100" />

                  {/* Relación Egreso/Ingreso */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Absorción de Gastos
                      </span>
                      <span className="text-xs font-bold text-zinc-700">
                        {expenseToIncomeRatio.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          expenseToIncomeRatio <= 50
                            ? "bg-emerald-500"
                            : expenseToIncomeRatio <= 85
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        )}
                        style={{ width: `${Math.min(expenseToIncomeRatio, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500">
                      Los egresos representan el {expenseToIncomeRatio.toFixed(0)}% de tus ingresos totales.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Distribución de Egresos */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-zinc-800">Distribución de Egresos</CardTitle>
                  <CardDescription>
                    ¿En qué estás gastando este mes?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {expenseByCategory.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-6">
                      No hay egresos registrados en este periodo.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {expenseByCategory.map((cat, idx) => (
                        <div key={cat.category} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-zinc-700">{cat.category}</span>
                            <span className="text-zinc-900 font-semibold">
                              {formatCurrency(cat.amount)} ({cat.percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                idx === 0
                                  ? "bg-emerald-500"
                                  : idx === 1
                                  ? "bg-teal-500"
                                  : idx === 2
                                  ? "bg-indigo-500"
                                  : "bg-zinc-400"
                              )}
                              style={{ width: `${cat.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
