import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentMonthKey, addMonths } from "@/lib/format";
import { ReportesClient } from "@/components/dashboard/reportes-client";
import type { Transaction } from "@/types";

export const metadata: Metadata = {
  title: "Reportes F29 · ContaFácil",
};

const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export default async function ReportesPage({
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

  // 2) Rango del mes seleccionado
  const rangeStart = `${selectedMonth}-01`;
  const rangeEnd = `${addMonths(selectedMonth, 1)}-01`; // exclusivo

  // 3) Consultar las transacciones del mes
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .gte("occurred_at", rangeStart)
    .lt("occurred_at", rangeEnd)
    .order("occurred_at", { ascending: true })
    .returns<Transaction[]>();

  const rows = transactions ?? [];

  return (
    <ReportesClient
      initialTransactions={rows}
      selectedMonth={selectedMonth}
      userEmail={user.email ?? ""}
    />
  );
}
