/**
 * Diccionario centralizado de términos contables "en lenguaje humano".
 *
 * Es la única fuente de verdad para las explicaciones que muestran los
 * tooltips y la vista principal del glosario.
 */

export interface GlossaryEntry {
  /** Etiqueta legible del término. */
  term: string;
  /** Explicación sencilla, pensada para alguien sin formación contable. */
  definition: string;
  /** Categoría a la que pertenece para el filtrado en la interfaz. */
  category: "Finanzas Básicas" | "Impuestos" | "Conceptos Clave" | "Operación";
  /** Fórmula simplificada del término, si aplica. */
  formula?: string;
  /** Ejemplo práctico basado en un negocio cotidiano para facilitar el entendimiento. */
  example: string;
}

export const GLOSSARY = {
  ingresos: {
    term: "Ingresos",
    definition: "El dinero total que entra a tu negocio por vender tus productos o servicios. Es todo lo que cobras, antes de restar cualquier gasto.",
    category: "Finanzas Básicas",
    formula: "Ingresos = Unidades vendidas × Precio de venta",
    example: "Si vendes 10 pasteles a $100 cada uno, tus ingresos son de $1,000. No importa cuánto gastaste en hacerlos, esta es la cantidad total de dinero que entró a tu caja.",
  },
  egresos: {
    term: "Egresos",
    definition: "El dinero que sale de tu negocio para poder operar: insumos, renta, sueldos, transporte, empaques, luz y agua. Todo lo que pagas.",
    category: "Finanzas Básicas",
    formula: "Egresos = Costo de materia prima + Gastos de operación",
    example: "Para hacer los pasteles que vendiste, compraste harina y huevos por $200 y pagaste $100 por la luz del horno. Tus egresos totales fueron de $300.",
  },
  balance: {
    term: "Balance",
    definition: "La resta entre el dinero que entra y el que sale en un periodo. Te indica si estás ganando dinero o si estás gastando de más.",
    category: "Conceptos Clave",
    formula: "Balance = Ingresos - Egresos",
    example: "Si cobraste $1,000 (ingresos) y gastaste $300 (egresos), tu balance es de +$700. Al ser positivo, vas por buen camino; si fuera negativo, significa que gastaste más de lo que ganaste.",
  },
  flujoEfectivo: {
    term: "Flujo de efectivo",
    definition: "El movimiento real de dinero físico o digital que entra y sale de tu cuenta al día. Te dice si tienes efectivo disponible AHORA para pagar tus cuentas.",
    category: "Operación",
    example: "Imagínate que vendiste $2,000 a un cliente que te pagará el próximo mes. Tienes el ingreso registrado, pero tu flujo de efectivo hoy es de $0. Si tienes que pagar la renta hoy, necesitarás flujo de efectivo real en tu cuenta.",
  },
  utilidad: {
    term: "Utilidad",
    definition: "La ganancia neta o limpia que te queda después de pagar absolutamente todos los gastos del negocio. Es lo que realmente te llevas a la bolsa.",
    category: "Conceptos Clave",
    formula: "Utilidad = Ingresos - Egresos - Impuestos",
    example: "De los $1,000 que vendiste, restas $300 de ingredientes, $100 de renta y $50 de impuestos. Tu utilidad es de $550. Esa es tu recompensa real.",
  },
  capital: {
    term: "Capital",
    definition: "El valor neto que tiene tu negocio. Es el dinero y los bienes que te quedarían si decidieras vender todo hoy y pagar todas tus deudas.",
    category: "Conceptos Clave",
    formula: "Capital = Lo que tienes (Activos) - Lo que debes (Pasivos)",
    example: "Tu panadería tiene un horno que vale $5,000 y $2,000 en efectivo en caja (Activos = $7,000), pero le debes $1,500 al proveedor de harina (Pasivos = $1,500). El capital real de tu negocio es de $5,500.",
  },
  iva: {
    term: "IVA",
    definition: "Impuesto al Valor Agregado. Es un impuesto del gobierno que tú le cobras al cliente en el precio de venta. Recuerda: ese dinero nunca es tuyo, solo lo guardas para entregárselo al fisco.",
    category: "Impuestos",
    formula: "IVA = Precio del producto × Tasa de impuesto (ej. 16%)",
    example: "Si vendes una mesa en $116 (con IVA del 16% incluido), $100 son de tu negocio y $16 son el IVA del gobierno. Debes separar esos $16 en otra cuenta para pagarlos cuando te corresponda; no son ganancias.",
  },
  depreciacion: {
    term: "Depreciación",
    definition: "La pérdida de valor que sufren tus herramientas, equipo o vehículos debido al uso y al paso del tiempo.",
    category: "Operación",
    formula: "Pérdida anual = Costo original / Años de vida útil esperada",
    example: "Si compras una moto de reparto por $15,000 y calculas que servirá por 5 años antes de fallar, la moto se deprecia $3,000 por año. Ese desgaste es un costo que debes considerar.",
  },
  activo: {
    term: "Activo",
    definition: "Cualquier cosa que posea tu negocio que tenga valor y que sirva para generar más dinero, como efectivo, mercancía para vender, maquinaria o tu local.",
    category: "Finanzas Básicas",
    example: "La batidora industrial, la mesa de acero inoxidable, los ingredientes guardados en el almacén y el dinero en la cuenta bancaria de tu negocio son tus activos.",
  },
  pasivo: {
    term: "Pasivo",
    definition: "Cualquier deuda, préstamo o compromiso de pago que tu negocio tenga pendiente de liquidar con terceras personas.",
    category: "Finanzas Básicas",
    example: "Si compraste una nevera a meses sin intereses y te falta pagar $4,000, o si el proveedor te dejó mercancía a crédito por $1,200, esas deudas son tus pasivos.",
  },
  deduccion: {
    term: "Deducción de Impuestos",
    definition: "Gastos necesarios para operar que la ley te permite restar de tus ingresos totales. Esto reduce la base sobre la cual se calculan tus impuestos, haciendo que pagues menos.",
    category: "Impuestos",
    example: "Si compras gasolina para la moto de reparto del negocio, ese gasto es deducible. Al declararlo, disminuye tu ganancia sujeta a impuestos, por lo que pagas menos al fisco de manera legal.",
  },
} as const satisfies Record<string, GlossaryEntry>;

/** Claves válidas del glosario (para autocompletado y seguridad de tipos). */
export type GlossaryKey = keyof typeof GLOSSARY;
