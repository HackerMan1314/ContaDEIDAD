"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2, Loader2, ArrowUpRight, ArrowDownRight, Receipt } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatMonthLabel } from "@/lib/format";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { TransactionModal } from "@/components/dashboard/transaction-modal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";

interface TransactionsManagerProps {
  initialTransactions: Transaction[];
  userId: string;
  selectedMonth: string;
}

export function TransactionsManager({
  initialTransactions,
  userId,
  selectedMonth,
}: TransactionsManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter transactions
  const filteredTransactions = initialTransactions.filter((tx) => {
    const matchesSearch =
      (tx.description?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (tx.category?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesType = typeFilter === "all" ? true : tx.type === typeFilter;

    return matchesSearch && matchesType;
  });

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar este movimiento?")) return;

    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    setDeletingId(null);

    if (error) {
      alert("Error al eliminar la transacción: " + error.message);
      return;
    }

    router.refresh();
  }

  // Calculate totals for filtered transactions
  const totalIncome = filteredTransactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = filteredTransactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netBalance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Receipt className="h-8 w-8 text-emerald-600 animate-pulse" />
            Transacciones
          </h1>
          <p className="text-slate-600 mt-1 text-sm md:text-base font-medium">
            Registra y gestiona los ingresos y egresos de tu negocio para el mes de {formatMonthLabel(selectedMonth)}.
          </p>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <MonthPicker selectedMonth={selectedMonth} />
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Agregar</span>
          </Button>
        </div>
      </div>

      {/* Mini Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-medium text-zinc-500">Ingresos Filtrados</span>
          <p className="text-base font-bold text-emerald-600 sm:text-lg">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-medium text-zinc-500">Egresos Filtrados</span>
          <p className="text-base font-bold text-rose-600 sm:text-lg">
            {formatCurrency(totalExpense)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-medium text-zinc-500">Balance Filtrado</span>
          <p
            className={cn(
              "text-base font-bold sm:text-lg",
              netBalance >= 0 ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {formatCurrency(netBalance)}
          </p>
        </div>
      </div>

      {/* Filter and Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-zinc-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Historial de Movimientos</CardTitle>
            <CardDescription>
              Filtra y busca entre los registros de este mes.
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Buscar descripción o categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type tabs in header */}
            <div className="flex rounded-lg bg-zinc-100 p-0.5 self-start sm:self-auto">
              {(["all", "income", "expense"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTypeFilter(filter)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-all capitalize",
                    typeFilter === filter
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  {filter === "all" ? "Todos" : filter === "income" ? "Ingresos" : "Egresos"}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/70 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      No se encontraron transacciones en este mes con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isIncome = tx.type === "income";
                    return (
                      <tr key={tx.id} className="hover:bg-zinc-50/50 transition-colors group">
                        {/* Fecha */}
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-600 font-medium">
                          {tx.occurred_at}
                        </td>
                        {/* Categoría */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              isIncome
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            )}
                          >
                            {tx.category || "General"}
                          </span>
                        </td>
                        {/* Descripción */}
                        <td className="px-6 py-4 text-zinc-700">
                          {tx.description || "—"}
                        </td>
                        {/* Tipo */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            {isIncome ? (
                              <>
                                <ArrowUpRight className="h-4.5 w-4.5 text-emerald-500" />
                                <span className="text-emerald-700 text-xs font-medium">Ingreso</span>
                              </>
                            ) : (
                              <>
                                <ArrowDownRight className="h-4.5 w-4.5 text-rose-500" />
                                <span className="text-rose-700 text-xs font-medium">Egreso</span>
                              </>
                            )}
                          </span>
                        </td>
                        {/* Monto */}
                        <td
                          className={cn(
                            "px-6 py-4 text-right font-bold whitespace-nowrap",
                            isIncome ? "text-emerald-600" : "text-rose-600"
                          )}
                        >
                          {isIncome ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </td>
                        {/* Acciones */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            disabled={deletingId === tx.id}
                            onClick={() => handleDelete(tx.id)}
                            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                            title="Eliminar movimiento"
                          >
                            {deletingId === tx.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Form Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
      />
    </div>
  );
}
