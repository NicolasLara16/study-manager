"use client";

import { useState } from "react";
import {
  Plus,
  CalendarClock,
  ListChecks,
  ChevronRight,
  MoreHorizontal,
  GraduationCap,
  Landmark,
  School,
  Code,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Toast } from "@/components/ui/toast";
import { goalsData, type Goal } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Tab = "ativos" | "arquivados" | "todos";

const tabLabels: Record<Tab, string> = {
  ativos: "Ativos",
  arquivados: "Arquivados",
  todos: "Todos",
};

const goalIcons: Record<string, LucideIcon> = {
  "enem-2027": GraduationCap,
  "concurso-bb": Landmark,
  faculdade: School,
  programacao: Code,
};

function GoalCard({ goal, selected, onSelect, onMenu }: { goal: Goal; selected: boolean; onSelect: () => void; onMenu: () => void }) {
  const Icon = goalIcons[goal.id] ?? ListChecks;

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-xl border bg-surface p-5 transition-all focus-within:ring-2 focus-within:ring-indigo",
        selected ? "border-indigo ring-2 ring-indigo" : "border-line"
      )}
      aria-current={selected ? "true" : undefined}
    >
      <button type="button" onClick={onSelect} className="rounded-lg focus-visible:outline-none" aria-label={`Selecionar ${goal.title}`}>
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-soft text-indigo"
          >
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 pr-8">
            <p className="truncate text-sm font-semibold text-[hsl(var(--text-primary))]">{goal.title}</p>
            <p className="truncate text-xs text-[hsl(var(--text-secondary))]">{goal.description}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-[hsl(var(--text-secondary))]">Progresso</span>
            <span className="font-semibold text-[hsl(var(--text-primary))]">{goal.progress}%</span>
          </div>
          <div
            className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--bg-subtle))]"
            role="progressbar"
            aria-valuenow={goal.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso de ${goal.title}: ${goal.progress}%`}
          >
            <div className="h-full rounded-full bg-success" style={{ width: `${goal.progress}%` }} />
          </div>
        </div>

        <dl className="mt-4 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-[hsl(var(--text-secondary))]">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
            <dt className="sr-only">Prazo</dt>
            <dd>{goal.target}</dd>
          </div>
          <div className="flex items-center gap-1 text-[hsl(var(--text-secondary))]">
            <ListChecks className="h-3.5 w-3.5" aria-hidden />
            <dt className="sr-only">Disciplinas</dt>
            <dd>{goal.disciplinesCount} disciplinas</dd>
          </div>
        </dl>
      </button>

      {/* Badge de status */}
      <span className="absolute right-3 top-3">
        <Badge
          label={goal.status === "ativo" ? "Ativo" : "Arquivado"}
          tone={goal.status === "ativo" ? "ready" : "neutral"}
        />
      </span>

      {/* Menu de opções demonstrativo */}
      <button
        type="button"
        onClick={onMenu}
        aria-label={`Opções de ${goal.title}`}
        className="absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[hsl(var(--text-muted))] hover:bg-subtle hover:text-[hsl(var(--text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>
    </article>
  );
}

export function GoalsView() {
  const [tab, setTab] = useState<Tab>("ativos");
  const [selected, setSelected] = useState(goalsData[0].id);
  const [toast, setToast] = useState<string | null>(null);

  const visibleGoals = goalsData.filter((g) =>
    tab === "todos" ? true : tab === "ativos" ? g.status === "ativo" : g.status === "arquivado"
  );
  const activeGoal = goalsData.find((g) => g.id === selected);

  const activesCount = goalsData.filter((g) => g.status === "ativo").length;
  const archivedCount = goalsData.length - activesCount;

  function showTab(next: Tab) {
    setTab(next);
    if (!goalsData.some((g) => g.id === selected && (next === "todos" || (next === "ativos" ? g.status === "ativo" : g.status === "arquivado")))) {
      setSelected(goalsData[0].id);
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--text-primary))]">
            Objetivos de estudo
          </h1>
          <p className="mt-1 max-w-lg text-sm text-[hsl(var(--text-secondary))]">
            Gerencie metas, disciplinas, prazos e sessões relacionadas.
          </p>
        </div>
        <button
          type="button"
          aria-label="Criar novo objetivo"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo px-4 text-sm font-medium text-white hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-app"
          onClick={() => setToast("Demonstração: a criação de objetivos estará disponível em breve.")}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Criar novo objetivo
        </button>
      </header>

      {/* Abas de filtro */}
      <div
        role="tablist"
        aria-label="Filtro de objetivos"
        className="inline-flex w-full rounded-xl border border-line bg-surface p-1 sm:w-auto sm:rounded-lg sm:bg-subtle sm:border-0"
      >
        {(Object.keys(tabLabels) as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => showTab(t)}
            className={cn(
              "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none",
              tab === t
                ? "bg-indigo-soft text-indigo"
                : "text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]"
            )}
          >
            {tabLabels[t]}
            <span className="ml-1.5 text-xs text-[hsl(var(--text-muted))]">
              {t === "ativos" ? activesCount : t === "arquivados" ? archivedCount : goalsData.length}
            </span>
          </button>
        ))}
      </div>

      {/* Grade de objetivos */}
      {visibleGoals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface p-12 text-center text-sm text-[hsl(var(--text-secondary))]">
          Nenhum objetivo nesta categoria.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              selected={activeGoal?.id === goal.id}
              onSelect={() => setSelected(goal.id)}
              onMenu={() => setToast(`Opções de "${goal.title}" — demonstração.`)}
            />
          ))}
        </div>
      )}

      {/* Disciplinas do objetivo selecionado */}
      {activeGoal && (tab === "todos" || matchesTab(activeGoal, tab)) && (
        <section aria-labelledby="titulo-disciplinas-obj">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="titulo-disciplinas-obj" className="text-base font-semibold text-[hsl(var(--text-primary))]">
              Disciplinas — {activeGoal.title}
            </h2>
            <button
              type="button"
              onClick={() => setToast(`Demonstração: adicionar disciplina a "${activeGoal.title}".`)}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-[hsl(var(--text-primary))] hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Adicionar disciplina
            </button>
          </div>
          <div className="rounded-xl border border-line bg-surface">
            <ul className="divide-y divide-[hsl(var(--border))]">
              {activeGoal.disciplines.map((d) => (
                <li key={d.name} className="flex items-center gap-4 px-5 py-3.5">
                  <span
                    aria-hidden
                    className="h-9 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: activeGoal.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[hsl(var(--text-primary))]">{d.name}</p>
                    <p className="text-xs text-[hsl(var(--text-secondary))]">{d.topics} assuntos</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-[hsl(var(--text-primary))]">
                    {d.percent}%
                  </span>
                  <div className="hidden w-28 shrink-0 sm:block">
                    <div
                      className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--bg-subtle))]"
                      role="progressbar"
                      aria-valuenow={d.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Avanço em ${d.name}: ${d.percent}%`}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${d.percent}%`,
                          backgroundColor: d.percent === 0 ? "hsl(var(--text-muted))" : activeGoal.color,
                        }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="hidden h-4 w-4 shrink-0 text-[hsl(var(--text-muted))] md:block" aria-hidden />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

function matchesTab(goal: Goal, tab: Tab): boolean {
  return tab === "arquivados" ? goal.status === "arquivado" : goal.status === "ativo";
}
