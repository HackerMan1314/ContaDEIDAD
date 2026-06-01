/**
 * Diccionario centralizado de términos contables "en lenguaje humano".
 *
 * Es la única fuente de verdad para las explicaciones que muestran los
 * tooltips. Añadir un término aquí lo deja disponible en toda la app vía
 * <GlossaryTerm termKey="..." />.
 */

export interface GlossaryEntry {
  /** Etiqueta legible del término. */
  term: string;
  /** Explicación sencilla, pensada para alguien sin formación contable. */
  definition: string;
}

export const GLOSSARY = {
  ingresos: {
    term: "Ingresos",
    definition:
      "El dinero que entra a tu negocio por vender productos o servicios. Es todo lo que cobras, antes de restar tus gastos.",
  },
  egresos: {
    term: "Egresos",
    definition:
      "El dinero que sale de tu negocio: renta, insumos, sueldos, servicios… Todo lo que pagas para operar.",
  },
  balance: {
    term: "Balance",
    definition:
      "La diferencia entre lo que entra y lo que sale. Positivo significa que ganaste; negativo, que gastaste más de lo que ingresaste.",
  },
  flujoEfectivo: {
    term: "Flujo de efectivo",
    definition:
      "El movimiento de dinero que entra y sale en un periodo. Te dice si tienes efectivo suficiente para cubrir tus pagos.",
  },
  utilidad: {
    term: "Utilidad",
    definition:
      "La ganancia real de tu negocio: lo que te queda de los ingresos después de pagar todos los egresos.",
  },
  capital: {
    term: "Capital",
    definition:
      "Lo que tu negocio realmente posee: el dinero y los bienes que quedan tras descontar lo que debes.",
  },
  iva: {
    term: "IVA",
    definition:
      "Impuesto al Valor Agregado. Un porcentaje que se suma al precio de venta y que luego entregas al fisco; no es ganancia tuya.",
  },
} as const satisfies Record<string, GlossaryEntry>;

/** Claves válidas del glosario (para autocompletado y seguridad de tipos). */
export type GlossaryKey = keyof typeof GLOSSARY;
