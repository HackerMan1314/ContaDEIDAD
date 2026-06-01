"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactCurrency, formatCurrency } from "@/lib/format";

export interface MonthlyChartDatum {
  /** Etiqueta corta del eje X, ej. "Jun 26". */
  month: string;
  Ingresos: number;
  Egresos: number;
  Balance: number;
}

interface MonthlyChartProps {
  data: MonthlyChartDatum[];
}

const COLORS = {
  Ingresos: "#10b981", // emerald-500
  Egresos: "#f43f5e", // rose-500
  Balance: "#3b82f6", // blue-500
} as const;

/**
 * Gráfico de evolución mensual. Recharts requiere ejecutarse en el cliente,
 * de ahí el "use client". El contenedor responsivo se adapta al ancho del card.
 */
export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke="#71717a"
          />
          <YAxis
            tickFormatter={(value) => formatCompactCurrency(Number(value))}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke="#71717a"
            width={64}
          />
          <Tooltip
            formatter={(value, name) => [formatCurrency(Number(value)), name]}
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid #e4e4e7",
              fontSize: "0.8rem",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "0.8rem", paddingTop: "0.5rem" }} />
          <Bar dataKey="Ingresos" fill={COLORS.Ingresos} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="Egresos" fill={COLORS.Egresos} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Line
            type="monotone"
            dataKey="Balance"
            stroke={COLORS.Balance}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
