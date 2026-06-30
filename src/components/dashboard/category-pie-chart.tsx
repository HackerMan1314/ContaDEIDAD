"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatCurrency } from "@/lib/format";

export interface CategoryDatum {
  category: string;
  amount: number;
  percentage: number;
}

interface CategoryPieChartProps {
  data: CategoryDatum[];
  colors: string[];
  emptyLabel: string;
}

/**
 * Gráfico de torta por categoría (ingresos o egresos). Recharts requiere
 * ejecutarse en el cliente, de ahí el "use client".
 */
export function CategoryPieChart({ data, colors, emptyLabel }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-zinc-500 text-center py-16">{emptyLabel}</p>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
          >
            {data.map((entry, idx) => (
              <Cell key={entry.category} fill={colors[idx % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [formatCurrency(Number(value)), name]}
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid #e4e4e7",
              fontSize: "0.8rem",
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: "0.75rem" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
