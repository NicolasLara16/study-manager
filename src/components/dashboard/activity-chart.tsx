"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { weeklyActivity, todayIndex } from "@/lib/mock-data";

const chartMax = Math.ceil((Math.max(...weeklyActivity.map((d) => d.minutes)) + 1) / 60) * 60;

function formatTick(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, "0") : ""}` : `${m}m`;
}

function SessionTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const minutes = payload[0].value ?? 0;
  const h = Math.floor(minutes / 60);
  const text = h > 0 ? `${h}h ${minutes % 60}min` : `${minutes}min`;

  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <p className="font-medium text-[hsl(var(--text-primary))]">{label}</p>
      <p className="text-[hsl(var(--text-secondary))]">{text} de estudo</p>
    </div>
  );
}

export function ActivityChart() {
  return (
    <div className="h-64 w-full" role="img" aria-label="Gráfico de atividade semanal de estudo">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={weeklyActivity} margin={{ top: 8, right: 0, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "hsl(var(--text-secondary))", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "hsl(var(--text-muted))", fontSize: 11 }}
            tickFormatter={formatTick}
            width={44}
            domain={[0, chartMax]}
            ticks={[0, chartMax / 4, chartMax / 2, (chartMax * 3) / 4, chartMax]}
          />
          <Tooltip
            content={<SessionTooltip />}
            cursor={{ fill: "hsl(var(--bg-subtle))", opacity: 0.6 }}
          />
          <Bar dataKey="minutes" radius={[6, 6, 0, 0]} maxBarSize={40} isAnimationActive={false}>
            {weeklyActivity.map((entry, index) => (
              <Cell
                key={entry.day}
                fill={
                  index === todayIndex ? "hsl(var(--indigo))" : "hsl(var(--indigo-soft))"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
