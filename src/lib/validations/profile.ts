import { z } from "zod";

/** Regex de teléfono flexible: dígitos, espacios y + - ( ) entre 7 y 20 chars. */
const PHONE_REGEX = /^[0-9+\-()\s]{7,20}$/;

export const profileSchema = z.object({
  business_name: z
    .string()
    .trim()
    .min(2, "El nombre del negocio es muy corto")
    .max(100, "Máximo 100 caracteres"),
  full_name: z
    .string()
    .trim()
    .min(2, "Tu nombre es muy corto")
    .max(100, "Máximo 100 caracteres"),
  // Teléfono opcional: se acepta vacío o un formato válido.
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || PHONE_REGEX.test(v), "Teléfono no válido"),
});

export type ProfileValues = z.infer<typeof profileSchema>;
