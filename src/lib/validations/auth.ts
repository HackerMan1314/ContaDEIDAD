import { z } from "zod";

/** Login: solo exigimos que ambos campos estén presentes y el correo sea válido. */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo es obligatorio")
    .email("Introduce un correo válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});
export type LoginValues = z.infer<typeof loginSchema>;

/**
 * Registro: validación rigurosa de contraseña (mín. 8, mayúscula, minúscula
 * y número) y confirmación que debe coincidir.
 */
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "El correo es obligatorio")
      .email("Introduce un correo válido"),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
      .regex(/[a-z]/, "Debe incluir al menos una minúscula")
      .regex(/[0-9]/, "Debe incluir al menos un número"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
export type RegisterValues = z.infer<typeof registerSchema>;
