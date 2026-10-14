import Link from "next/link";
import {
  Flame,
  Sparkles,
  Clock3,
  Target,
  Play,
} from "lucide-react";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { RecentSessions, UpcomingSessions } from "@/components/dashboard/session-lists";
import { ActiveGoalCard, WeeklyGoalCard } from "@/components/dashboard/goal-cards";
import { MetricCard } from "@/components/ui/metric-card";
import {
  dashboardMetrics,
  todayIndex,
  weeklyActivity,
} from "@/lib/mock-data";

const metricIcons = [
  <Clock3 key="k1" className="h-5 w-5" aria-hidden />,
  <Target key="k2" className="h-5 w-5" aria-hidden />,
  <Flame key="k3" className="h-5 w-5" aria-hidden />,
  <Sparkles key="k4" className="h-5 w-5" aria-hidden />,
];

export default function DashboardPage() {
  const todayMinutes = weeklyActivity[todayIndex].minutes;

  return (
    <div className="space-y-6">
      {/* Cabeçalho de boas-vindas */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--text-primary))]">
            Bom dia, Marina
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--text-secondary))]">
            Você está a <strong className="font-medium text-[hsl(var(--text-primary))]">1h 48min</strong> de
            concluir sua meta semanal. {todayMinutes}min registrados hoje.
          </p>
        </div>
        <Link
          href="/estudo"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo px-4 text-sm font-medium text-white transition-colors hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-app"
        >
          <Play className="h-4 w-4" aria-hidden />
          Iniciar estudo
        </Link>
      </header>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric, index) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            hint={metric.hint}
            hintPositive={metric.hintPositive}
            icon={metricIcons[index]}
          />
        ))}
      </div>

      {/* Atividade semanal + Meta */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section
          className="rounded-xl border border-line bg-surface p-5 xl:col-span-2"
          aria-labelledby="titulo-atividade"
        >
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 id="titulo-atividade" className="text-base font-semibold text-[hsl(var(--text-primary))]">
                Atividade semanal
              </h2>
              <p className="text-xs text-[hsl(var(--text-secondary))]">
                Tempo de estudo nos últimos 7 dias
              </p>
            </div>
            <span className="rounded-lg bg-subtle px-2.5 py-1 text-xs font-medium text-[hsl(var(--text-secondary))]">
              14–20 out
            </span>
          </div>
          <ActivityChart />
        </section>
        <WeeklyGoalCard />
      </div>

      {/* Sessões */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentSessions />
        <UpcomingSessions />
      </div>

      {/* Objetivo ativo */}
      <ActiveGoalCard />
    </div>
  );
}
