import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z
    .number({ message: "Ingresa un monto válido" })
    .positive("El monto debe ser mayor a cero"),
  category: z
    .string()
    .min(1, "Selecciona una categoría"),
  description: z
    .string()
    .trim()
    .max(200, "Máximo 200 caracteres")
    .optional()
    .or(z.literal("")),
  occurred_at: z
    .string()
    .min(1, "Selecciona la fecha del movimiento")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
});

export type TransactionValues = z.infer<typeof transactionSchema>;
