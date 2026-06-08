import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentMonthKey, addMonths } from "@/lib/format";
import { TransactionsManager } from "@/components/dashboard/transactions-manager";
import type { Transaction } from "@/types";

export const metadata: Metadata = {
  title: "Transacciones · ContaFácil",
};

const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export default async function TransaccionesPage({
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
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<Transaction[]>();

  const rows = transactions ?? [];

  return (
    <TransactionsManager
      initialTransactions={rows}
      userId={user.id}
      selectedMonth={selectedMonth}
    />
  );
}
