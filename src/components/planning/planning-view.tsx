"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Play,
  Plus,
  Target,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import {
  plannedBlocks,
  dayNames,
  weekDates,
  todayDate,
  disciplineGoals,
  type PlannedBlock,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type ViewMode = "calendario" | "lista";

/** Semana de referência mock do Frame 4: Seg 14 de outubro (sem 0 = 14–20 de outubro) */
function weekLabel(offset: number): string {
  const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const start = new Date(2026, 9, 14 + offset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} — ${end.getDate()} de ${months[start.getMonth()]}`;
  }
  return `${start.getDate()} ${months[start.getMonth()]} — ${end.getDate()} ${months[end.getMonth()]}`;
}

function BlockCard({ block }: { block: PlannedBlock }) {
  return (
    <article
      className="rounded-lg border border-line border-l-4 bg-subtle p-2.5 transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
      style={{ borderLeftColor: block.color }}
    >
      <p className="text-xs font-semibold tabular-nums text-[hsl(var(--text-primary))]">
        {block.time}
        <span className="ml-1.5 font-normal text-[hsl(var(--text-secondary))]">{block.duration}</span>
      </p>
      <p className="mt-1 truncate text-sm font-medium text-[hsl(var(--text-primary))]">{block.subject}</p>
      <p className="truncate text-xs text-[hsl(var(--text-secondary))]">{block.topic}</p>
    </article>
  );
}

export function PlanningView() {
  const [objectiveIdx, setObjectiveIdx] = useState(0);
  const [view, setView] = useState<ViewMode>("calendario");
  const [weekOffset, setWeekOffset] = useState(0);
  const [blocks, setBlocks] = useState<PlannedBlock[]>(plannedBlocks);
  const [toast, setToast] = useState<string | null>(null);

  const blocksThisWeek = weekOffset === 0 ? blocks : [];
  const objectives = ["ENEM 2027", "Concurso Banco do Brasil", "Faculdade"];

  function shiftWeek(delta: number) {
    setWeekOffset((w) => Math.min(4, Math.max(-4, w + delta)));
  }

  /** Adiciona uma sessão demonstrativa ao plano da semana atual */
  function addBlockToPlan() {
    if (weekOffset !== 0) setWeekOffset(0);
    const next: PlannedBlock = {
      day: 0,
      time: "21:30",
      subject: "Sessão livre",
      topic: "Definir depois",
      duration: "50 min",
      color: "#4F46E5",
    };
    setBlocks((b) => [...b, next]);
    setToast("Sessão adicionada ao plano de segunda-feira (21:30).");
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho e ações */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--text-primary))]">
            Meu planejamento
          </h1>
          <p className="mt-1 max-w-md text-sm text-[hsl(var(--text-secondary))]">
            Organize a semana com blocos realistas e metas por disciplina.
          </p>
        </div>
        <button
          type="button"
          onClick={addBlockToPlan}
          aria-label="Adicionar sessão ao plano"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo px-4 text-sm font-medium text-white hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-app"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Adicionar sessão ao plano
        </button>
      </header>

      {/* Ferramentas: objetivo + alternância de visualização */}
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-3">
          <Select
            id="plan-objetivo"
            label="Objetivo"
            icon={<Target className="h-4 w-4 text-indigo" aria-hidden />}
            value={objectiveIdx}
            onChange={(e) => setObjectiveIdx(Number(e.target.value))}
            className="w-full sm:w-56"
          >
            {objectives.map((o, i) => (
              <option key={o} value={i}>
                {o}
              </option>
            ))}
          </Select>
        </div>

        <div role="tablist" aria-label="Modo de visualização" className="flex w-full rounded-lg bg-subtle p-1 sm:w-auto">
          {(["calendario", "lista"] as ViewMode[]).map((v) => {
            const Icon = v === "calendario" ? CalendarDays : List;
            return (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors sm:flex-none",
                  view === v
                    ? "bg-indigo-soft text-indigo"
                    : "text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {v === "calendario" ? "Calendário" : "Lista"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Área principal: navegação semanal + semana */}
        <div className="space-y-4 xl:col-span-2">
          {/* Navegação semanal */}
          <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
            <button
              type="button"
              onClick={() => shiftWeek(-1)}
              aria-label="Semana anterior"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-[hsl(var(--text-secondary))] hover:bg-subtle hover:text-[hsl(var(--text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>

            <p className="text-sm font-medium text-[hsl(var(--text-primary))]" aria-live="polite">
              {weekLabel(weekOffset)}
            </p>

            <div className="flex items-center gap-2">
              {weekOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setWeekOffset(0)}
                  className="inline-flex h-9 items-center rounded-lg px-3 text-xs font-medium text-indigo hover:bg-indigo-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
                >
                  Semana atual
                </button>
              )}
              <button
                type="button"
                onClick={() => shiftWeek(1)}
                aria-label="Próxima semana"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-[hsl(var(--text-secondary))] hover:bg-subtle hover:text-[hsl(var(--text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          {/* Conteúdo da semana */}
          {blocksThisWeek.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface p-12 text-center">
              <p className="text-sm font-medium text-[hsl(var(--text-primary))]">
                Nenhuma sessão planejada para esta semana
              </p>
              <p className="max-w-sm text-xs text-[hsl(var(--text-secondary))]">
                Volte para a semana atual para revisar seus blocos planejados.
              </p>
            </div>
          ) : view === "calendario" ? (
            <section aria-label="Grade semanal de blocos de estudo" className="overflow-x-auto pb-2">
              <div className="grid min-w-[760px] grid-cols-7 gap-3 xl:min-w-0">
                {dayNames.map((name, dayIdx) => {
                  const dayBlocks = blocksThisWeek
                    .filter((b) => b.day === dayIdx)
                    .sort((a, b) => (a.time < b.time ? -1 : 1));

                  return (
                    <div
                      key={name}
                      className="flex min-h-[240px] flex-col gap-2 rounded-xl border border-line bg-surface p-2.5"
                    >
                      <h3
                        className={cn(
                          "rounded-lg px-1 py-1 text-center text-xs font-semibold",
                          weekDates[dayIdx] === todayDate
                            ? "bg-indigo-soft text-indigo"
                            : "text-[hsl(var(--text-secondary))]"
                        )}
                      >
                        {name}
                        <span
                          className={cn(
                            "block text-[10px] font-medium",
                            weekDates[dayIdx] !== todayDate && "text-[hsl(var(--text-muted))]"
                          )}
                        >
                          {weekDates[dayIdx]}
                        </span>
                      </h3>
                      {dayBlocks.length === 0 ? (
                        <p className="mt-2 text-center text-[11px] leading-snug text-[hsl(var(--text-muted))]">
                          Livre
                        </p>
                      ) : (
                        dayBlocks.map((b) => <BlockCard key={`${b.day}-${b.time}`} block={b} />)
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            /* Lista agrupada por dia */
            <section aria-label="Lista semanal de blocos de estudo" className="space-y-3">
              {dayNames.map((name, dayIdx) => {
                const dayBlocks = blocksThisWeek
                  .filter((b) => b.day === dayIdx)
                  .sort((a, b) => (a.time < b.time ? -1 : 1));

                return (
                  <div key={name} className="rounded-xl border border-line bg-surface">
                    <div className="flex items-baseline justify-between border-b border-[hsl(var(--border))] px-4 py-2.5">
                      <h3 className="text-sm font-semibold text-[hsl(var(--text-primary))]">
                        {name
                          .replace("Seg", "Segunda")
                          .replace("Ter", "Terça")
                          .replace("Qua", "Quarta")
                          .replace("Qui", "Quinta")
                          .replace("Sex", "Sexta")
                          .replace("Sáb", "Sábado")
                          .replace("Dom", "Domingo")}{" "}
                        <span className="font-normal text-[hsl(var(--text-secondary))]">
                          {weekDates[dayIdx]}
                        </span>
                      </h3>
                      {dayBlocks.length === 0 && (
                        <span className="text-xs text-[hsl(var(--text-muted))]">Dia livre</span>
                      )}
                    </div>
                    {dayBlocks.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-[hsl(var(--text-muted))]">
                        Nenhuma sessão planejada
                      </p>
                    ) : (
                      <ul className="divide-y divide-[hsl(var(--border))]">
                        {dayBlocks.map((b) => (
                          <li key={`${b.day}-${b.time}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-subtle">
                            <span
                              aria-hidden
                              className="h-9 w-1 shrink-0 rounded-full"
                              style={{ backgroundColor: b.color }}
                            />
                            <span className="w-14 shrink-0 text-xs font-semibold tabular-nums text-[hsl(var(--text-secondary))]">
                              {b.time}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[hsl(var(--text-primary))]">{b.subject}</p>
                              <p className="truncate text-xs text-[hsl(var(--text-secondary))]">{b.topic}</p>
                            </div>
                            <span className="shrink-0 text-sm tabular-nums text-[hsl(var(--text-secondary))]">{b.duration}</span>
                            <Link
                              href="/estudo"
                              aria-label={`Estudar ${b.subject}: ${b.topic} agora`}
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-[hsl(var(--text-primary))] hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
                            >
                              <Play className="h-3 w-3" aria-hidden />
                              Estudar
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </section>
          )}
        </div>

        {/* Painel lateral: Metas por disciplina */}
        <aside className="rounded-xl border border-line bg-surface p-5" aria-labelledby="titulo-metas-disciplina">
          <h2 id="titulo-metas-disciplina" className="text-base font-semibold text-[hsl(var(--text-primary))]">
            Metas por disciplina
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {disciplineGoals.map((g) => (
              <li key={g.subject}>
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: g.color }}
                  />
                  <p className="flex-1 text-sm font-medium text-[hsl(var(--text-primary))]">{g.subject}</p>
                  <span className="text-xs font-semibold tabular-nums text-[hsl(var(--text-secondary))]">
                    {g.detail}
                  </span>
                </div>
                <div
                  className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--bg-subtle))]"
                  role="progressbar"
                  aria-valuenow={g.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Meta de ${g.subject}: ${g.detail}`}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${g.percent}%`, backgroundColor: g.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-lg bg-subtle p-3 text-xs leading-snug text-[hsl(var(--text-secondary))]">
            As metas refletem os blocos planejados da semana atual.
          </p>
        </aside>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
