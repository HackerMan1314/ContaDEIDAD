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

const RADIAN = Math.PI / 180;

/** Etiqueta de porcentaje centrada en cada porción; oculta en porciones muy chicas para evitar solapamiento. */
function renderPercentLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}) {
  const {
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    percent = 0,
  } = props;
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
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
            label={renderPercentLabel}
            labelLine={false}
          >
            {data.map((entry, idx) => (
              <Cell key={entry.category} fill={colors[idx % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name, entry) => {
              const payload = entry.payload as CategoryDatum | undefined;
              const pct = payload ? Math.round(payload.percentage) : 0;
              return [`${formatCurrency(Number(value))} (${pct}%)`, name];
            }}
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
