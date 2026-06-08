"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { transactionSchema, type TransactionValues } from "@/lib/validations/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const INCOME_CATEGORIES = ["Ventas", "Servicios", "Otros ingresos"];
const EXPENSE_CATEGORIES = ["Renta", "Insumos", "Nómina", "Servicios", "Marketing", "Transporte"];

export function TransactionModal({ isOpen, onClose, userId }: TransactionModalProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "income",
      amount: 0,
      category: "",
      description: "",
      occurred_at: new Date().toISOString().split("T")[0],
    },
  });

  const selectedType = watch("type");

  // Reset target categories when type changes
  useEffect(() => {
    setValue("category", "");
  }, [selectedType, setValue]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        type: "income",
        amount: 0,
        category: "",
        description: "",
        occurred_at: new Date().toISOString().split("T")[0],
      });
      setServerError(null);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  async function onSubmit(values: TransactionValues) {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      type: values.type,
      amount: values.amount,
      category: values.category,
      description: values.description || null,
      occurred_at: values.occurred_at,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    onClose();
    router.refresh();
  }

  const activeCategories = selectedType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md scale-100 transform overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900">Agregar Movimiento</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Tipo de movimiento: Tabs */}
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de movimiento</Label>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-100 p-1">
              <button
                type="button"
                className={cn(
                  "flex justify-center items-center py-2 px-3 text-sm font-medium rounded-md transition-all",
                  selectedType === "income"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                )}
                onClick={() => setValue("type", "income")}
              >
                Ingreso
              </button>
              <button
                type="button"
                className={cn(
                  "flex justify-center items-center py-2 px-3 text-sm font-medium rounded-md transition-all",
                  selectedType === "expense"
                    ? "bg-white text-rose-700 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                )}
                onClick={() => setValue("type", "expense")}
              >
                Egreso
              </button>
            </div>
          </div>

          {/* Monto */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Monto *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                aria-invalid={!!errors.amount}
                {...register("amount", { valueAsNumber: true })}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Categoría */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Categoría *</Label>
            <select
              id="category"
              className={cn(
                "flex h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition-colors focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-red-500",
                errors.category && "border-red-500 focus-visible:ring-red-500/30"
              )}
              aria-invalid={!!errors.category}
              {...register("category")}
            >
              <option value="" disabled>Selecciona una categoría</option>
              {activeCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-red-600">{errors.category.message}</p>
            )}
          </div>

          {/* Fecha */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="occurred_at">Fecha *</Label>
            <Input
              id="occurred_at"
              type="date"
              aria-invalid={!!errors.occurred_at}
              {...register("occurred_at")}
            />
            {errors.occurred_at && (
              <p className="text-xs text-red-600">{errors.occurred_at.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input
              id="description"
              placeholder="Ej. Pago factura #10"
              aria-invalid={!!errors.description}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          {serverError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </p>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(selectedType === "expense" && "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500")}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
