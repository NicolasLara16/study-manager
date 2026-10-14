"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Clock3, CheckCheck, Crosshair, Flame, Search } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import {
  statsBars,
  statsMetrics,
  disciplineShares,
  statisticsHistory,
  type StatsPeriod,
} from "@/lib/mock-stats";
import { cn } from "@/lib/utils";

const periodOptions: Array<{ key: StatsPeriod; label: string }> = [
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
  { key: "custom", label: "Personalizado" },
];

const metricIcons = [
  <Clock3 key="m1" className="h-5 w-5" aria-hidden />,
  <CheckCheck key="m2" className="h-5 w-5" aria-hidden />,
  <Crosshair key="m3" className="h-5 w-5" aria-hidden />,
  <Flame key="m4" className="h-5 w-5" aria-hidden />,
];

/** Eixo Y em horas inteiras */
function formatTick(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, "0") : ""}` : `${m}m`;
}

function ChartTooltip({
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

const statusStyles: Record<string, string> = {
  concluida: "bg-success/10 text-success",
  pausada: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "nao-iniciada": "bg-subtle text-[hsl(var(--text-secondary))]",
};
const statusLabels: Record<string, string> = {
  concluida: "Concluída",
  pausada: "Pausada",
  "nao-iniciada": "Não iniciada",
};

export function StatisticsView() {
  const [period, setPeriod] = useState<StatsPeriod>("30d");
  const [historyFilter, setHistoryFilter] = useState("Todas");
  const [historySearch, setHistorySearch] = useState("");

  const bars = statsBars[period];
  const metrics = statsMetrics[period];
  const shares = disciplineShares[period];
  const chartMax = Math.ceil((Math.max(...bars.map((b) => b.minutes)) + 1) / 240) * 240;

  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    return statisticsHistory.filter((r) => {
      if (historyFilter !== "Todas" && statusLabels[r.status] !== historyFilter) return false;
      if (q && !`${r.subject} ${r.objetivo}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [historyFilter, historySearch]);

  /* Destaca o período mais recente (última barra) */
  const highlightIndex = bars.length - 1;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--text-primary))]">
            Estatísticas
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--text-secondary))]">
            Acompanhe consistência, evolução e distribuição do seu tempo.
          </p>
        </div>

        {/* Filtros de período */}
        <div role="tablist" aria-label="Período dos dados" className="flex rounded-lg bg-subtle p-1">
          {periodOptions.map((p) => (
            <button
              key={p.key}
              role="tab"
              aria-selected={period === p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm",
                period === p.key
                  ? "bg-indigo-soft text-indigo"
                  : "text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {/* Inputs demonstrativos quando Personalizado */}
      {period === "custom" && (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-end" aria-label="Período personalizado">
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-xs font-medium text-[hsl(var(--text-secondary))]">De</span>
            <input
              type="date"
              defaultValue="2026-10-14"
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-[hsl(var(--text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
            />
          </label>
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-xs font-medium text-[hsl(var(--text-secondary))]">Até</span>
            <input
              type="date"
              defaultValue="2026-10-20"
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-[hsl(var(--text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
            />
          </label>
        </div>
      )}

      {/* Indicadores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard
            key={m.label}
            label={m.label}
            value={m.value}
            hint={m.hint}
            hintPositive={m.hintPositive}
            icon={metricIcons[i]}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Evolução */}
        <section
          className="rounded-xl border border-line bg-surface p-5 xl:col-span-2"
          aria-labelledby="titulo-evolucao"
        >
          <div className="mb-2">
            <h2 id="titulo-evolucao" className="text-base font-semibold text-[hsl(var(--text-primary))]">
              Evolução do tempo de estudo
            </h2>
            <p className="text-xs text-[hsl(var(--text-secondary))]">
              {period === "30d" || period === "90d" ? "Minutos por semana" : "Minutos por dia"}
            </p>
          </div>
          <div className="h-64 w-full" role="img" aria-label="Gráfico de evolução do tempo de estudo">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars} margin={{ top: 8, right: 0, bottom: 0, left: -18 }}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--text-secondary))", fontSize: 12 }}
                  interval={0}
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
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--bg-subtle))", opacity: 0.6 }} />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]} maxBarSize={40} isAnimationActive={false}>
                  {bars.map((_, i) => (
                    <Cell key={i} fill={i === highlightIndex ? "hsl(var(--indigo))" : "hsl(var(--indigo-soft))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Distribuição por disciplina */}
        <section
          className="rounded-xl border border-line bg-surface p-5"
          aria-labelledby="titulo-distribuicao"
        >
          <h2 id="titulo-distribuicao" className="text-base font-semibold text-[hsl(var(--text-primary))]">
            Tempo por disciplina
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {shares.map((s) => {
              const max = Math.max(...shares.map((x) => x.minutes));
              const percent = Math.round((s.minutes / max) * 100);
              return (
                <li key={s.name}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-[hsl(var(--text-primary))]">{s.name}</span>
                    <span className="text-xs tabular-nums text-[hsl(var(--text-secondary))]">{s.hours}</span>
                  </div>
                  <div
                    className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--bg-subtle))]"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Tempo em ${s.name}: ${s.hours}`}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${percent}%`, backgroundColor: s.color }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Histórico de sessões */}
      <section aria-labelledby="titulo-historico-stat" className="rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-[hsl(var(--border))] p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="titulo-historico-stat" className="text-base font-semibold text-[hsl(var(--text-primary))]">
            Histórico de sessões
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--text-muted))]" aria-hidden />
              <input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Buscar por disciplina..."
                aria-label="Buscar sessões no histórico"
                className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo sm:w-52"
              />
            </div>
            <select
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              aria-label="Filtrar histórico por status"
              className="h-9 rounded-lg border border-line bg-surface px-3 text-sm text-[hsl(var(--text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
            >
              {["Todas", "Finalizada", "Pausada", "Não iniciada"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <p className="p-10 text-center text-sm text-[hsl(var(--text-secondary))]">
            Nenhuma sessão corresponde aos filtros aplicados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <caption className="sr-only">Histórico de sessões de estudo filtrável</caption>
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-[hsl(var(--text-muted))]">
                  <th scope="col" className="px-5 py-2.5 font-medium">Data</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Disciplina</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Objetivo</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Duração</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {filteredHistory.map((r) => (
                  <tr key={`${r.subject}-${r.date}`} className="hover:bg-subtle/60">
                    <td className="px-5 py-3 tabular-nums text-[hsl(var(--text-secondary))]">{r.date}</td>
                    <td className="px-3 py-3 font-medium text-[hsl(var(--text-primary))]">{r.subject}</td>
                    <td className="px-3 py-3 text-[hsl(var(--text-secondary))]">{r.objetivo}</td>
                    <td className="px-3 py-3 tabular-nums text-[hsl(var(--text-secondary))]">{r.duration}</td>
                    <td className="px-3 py-3">
                      <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", statusStyles[r.status])}>
                        {statusLabels[r.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
