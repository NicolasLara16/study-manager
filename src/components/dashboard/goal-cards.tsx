import Link from "next/link";
import { Target, ChevronRight } from "lucide-react";
import { activeGoal, goalDistribution, weeklyGoal } from "@/lib/mock-data";

/** Meta semanal detalhada: 8h12 de 10h + distribuição por disciplina */
export function WeeklyGoalCard() {
  return (
    <section
      className="flex flex-col rounded-xl border border-line bg-surface p-5"
      aria-labelledby="titulo-meta-semanal"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-soft text-indigo">
          <Target className="h-5 w-5" aria-hidden />
        </div>
        <h2 id="titulo-meta-semanal" className="text-base font-semibold text-[hsl(var(--text-primary))]">
          Meta semanal
        </h2>
      </div>

      <p className="mt-4">
        <span className="text-3xl font-semibold tracking-tight text-[hsl(var(--text-primary))]">
          {weeklyGoal.done}
        </span>{" "}
        <span className="text-sm font-normal text-[hsl(var(--text-secondary))]">{weeklyGoal.total}</span>
      </p>

      <div
        className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[hsl(var(--bg-subtle))]"
        role="progressbar"
        aria-valuenow={weeklyGoal.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progresso da meta semanal: ${weeklyGoal.percent}%`}
      >
        <div
          className="h-full rounded-full bg-indigo transition-all"
          style={{ width: `${weeklyGoal.percent}%` }}
        />
      </div>

      <p className="mt-3 text-xs leading-snug text-[hsl(var(--text-secondary))]">
        {weeklyGoal.message}
      </p>

      {/* Distribuição por disciplina */}
      <div className="mt-5 border-t border-[hsl(var(--border))] pt-4">
        <p className="text-xs font-medium text-[hsl(var(--text-secondary))]">
          Distribuição do tempo
        </p>
        <div
          aria-hidden
          className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--bg-subtle))]"
        >
          {goalDistribution.map((d) => (
            <div key={d.subject} style={{ width: `${d.percent}%`, backgroundColor: d.color }} />
          ))}
        </div>
        <ul className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          {goalDistribution.map((d) => (
            <li key={d.subject} className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-secondary))]">
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              {d.subject} <span className="font-semibold text-[hsl(var(--text-primary))]">{d.percent}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Objetivo ativo: ENEM 2027 */
export function ActiveGoalCard() {
  return (
    <section
      className="rounded-xl border border-line bg-surface p-5"
      aria-labelledby="titulo-objetivo-ativo"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-soft text-indigo">
            <Target className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--text-secondary))]">
              Objetivo ativo
            </p>
            <h2 id="titulo-objetivo-ativo" className="text-lg font-semibold text-[hsl(var(--text-primary))]">
              {activeGoal.title}
            </h2>
            <p className="text-sm text-[hsl(var(--text-secondary))]">{activeGoal.weeklyTarget}</p>
          </div>
        </div>

        <div className="w-full lg:max-w-md">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-[hsl(var(--text-secondary))]">Progresso</span>
            <span className="font-semibold text-[hsl(var(--text-primary))]">
              {activeGoal.progressLabel}
            </span>
          </div>
          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--bg-subtle))]"
            role="progressbar"
            aria-valuenow={activeGoal.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso: ${activeGoal.progressLabel}`}
          >
            <div
              className="h-full rounded-full bg-success transition-all"
              style={{ width: `${activeGoal.progress}%` }}
            />
          </div>
        </div>

        <Link
          href="/objetivos"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-[hsl(var(--text-primary))] transition-colors hover:bg-subtle"
        >
          Ver objetivo
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
