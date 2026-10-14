"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CirclePlay, Play, Pause, RotateCcw, Square, Plus, Target, BookOpen, ListTree } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { objectivesTree, studyHistory, type StudySession, type SessionStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Mode = "livre" | "pomodoro";
type Status = "idle" | "running" | "paused";

const POMODORO_KEY = "study-manager-pomodoro";

function readPomodoroSeconds() {
  if (typeof window === "undefined") {
    return { focus: 25 * 60, short: 5 * 60 };
  }
  try {
    const raw = window.localStorage.getItem(POMODORO_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { focus: number; short: number };
      return {
        focus: Math.max(60, (parsed.focus ?? 25) * 60),
        short: Math.max(30, (parsed.short ?? 5) * 60),
      };
    }
  } catch {
    /* localStorage indisponível */
  }
  return { focus: 25 * 60, short: 5 * 60 };
}



const POMODORO_CYCLES = 4;

function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  return `${m} min`;
}

export function StudyWorkbench() {
  const [mode, setMode] = useState<Mode>("livre");
  const [status, setStatus] = useState<Status>("idle");
  const [phase, setPhase] = useState<"foco" | "pausa">("foco");
  /** Segundos decorridos na fase atual (livre: total da sessão; pomodoro: da fase corrente) */
  const [phaseSeconds, setPhaseSeconds] = useState(0);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [breakSeconds, setBreakSeconds] = useState(5 * 60);
  const [cycles, setCycles] = useState(0);
  const [objectiveIdx, setObjectiveIdx] = useState(0);
  const [discipline, setDiscipline] = useState(objectivesTree[0].disciplines[0].name);
  const [topic, setTopic] = useState(objectivesTree[0].disciplines[0].topics[0]);
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<StudySession[]>(studyHistory);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const objective = objectivesTree[objectiveIdx];
  const disciplines = objective.disciplines;
  const topics = disciplines.find((d) => d.name === discipline)?.topics ?? [];

  /* Carrega durações configuradas em Configurações (demo, apenas local) */
  useEffect(() => {
    const stored = readPomodoroSeconds();
    setFocusSeconds(stored.focus);
    setBreakSeconds(stored.short);
  }, []);

  /* Tick de 1s — intervalo criado somente quando rodando, fechado no cleanup */
  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setPhaseSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  /* Transição automática de fase do Pomodoro */
  useEffect(() => {
    if (mode !== "pomodoro" || status !== "running") return;
    const limit = phase === "foco" ? focusSeconds : breakSeconds;
    if (phaseSeconds < limit) return;

    if (phase === "foco") {
      setCycles((c) => Math.min(c + 1, POMODORO_CYCLES));
      setPhase("pausa");
      setPhaseSeconds(0);
      setToast("Foco concluído! Iniciando pausa de 5 minutos.");
    } else {
      setPhase("foco");
      setPhaseSeconds(0);
      setToast("Pausa concluída. Boa, nova rodada de foco!");
    }
  }, [phaseSeconds, phase, status, mode, focusSeconds, breakSeconds]);

  /* Auto-dismiss do toast e cleanup do timer do toast ao desmontar */
  useEffect(() => {
    if (!toast) return;
    toastTimer.current = setTimeout(() => setToast(null), 4000);
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      clearTimeout(toastTimer.current ?? undefined);
    };
  }, [toast]);

  /* Sem intervalos/estado "vazando" ao trocar de modo */
  function switchMode(next: Mode) {
    setMode(next);
    resetRun();
  }

  function resetRun() {
    setStatus("idle");
    setPhase("foco");
    setPhaseSeconds(0);
    setCycles(0);
  }

  const completedFocusSeconds =
    phase === "foco" ? cycles * focusSeconds + phaseSeconds : cycles * focusSeconds;
  const totalSeconds = mode === "livre" ? phaseSeconds : completedFocusSeconds;
  const canFinish = totalSeconds > 0;

  function handleFinish() {
    const duration = formatDuration(totalSeconds);
    const newSession: StudySession = {
      subject: discipline,
      topic,
      when: "Agora",
      mode: mode === "livre" ? "Foco profundo" : `Pomodoro (${cycles}/${POMODORO_CYCLES})`,
      duration,
      status: "concluida",
      marker: objective.color,
    };
    setHistory((h) => [newSession, ...h].slice(0, 8));
    setConfirmOpen(false);
    resetRun();
    setToast("Sessão finalizada com sucesso!");
  }

  function addManualSession() {
    const newSession: StudySession = {
      subject: "Sessão manual",
      topic: "Registro rápido",
      when: "Agora",
      mode: "Foco profundo",
      duration: "A definir",
      status: "nao-iniciada",
      marker: objective.color,
    };
    setHistory((h) => [newSession, ...h].slice(0, 8));
    setToast("Sessão manual adicionada ao histórico.");
  }

  function changeObjective(idx: number) {
    setObjectiveIdx(idx);
    const first = objectivesTree[idx].disciplines[0];
    setDiscipline(first.name);
    setTopic(first.topics[0]);
  }

  function changeDiscipline(name: string) {
    setDiscipline(name);
    setTopic(disciplines.find((d) => d.name === name)?.topics[0] ?? "");
  }

  const hasNotes = useMemo(() => notes.trim().length > 0, [notes]);

  function statusLabel(): string {
    if (status === "idle") return "Pronta para iniciar";
    if (status === "paused") return "Pausada";
    if (mode === "pomodoro" && phase === "pausa") return "Pausa (Pomodoro)";
    return "Sessão em andamento";
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da página */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--text-primary))]">
            Sessão de estudo
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--text-secondary))]">
            Concentre-se em uma tarefa por vez. Seu progresso será salvo ao finalizar.
          </p>
        </div>
        <button
          type="button"
          onClick={addManualSession}
          aria-label="Adicionar sessão manual"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-[hsl(var(--text-primary))] hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Adicionar sessão manual
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {/* Cronômetro */}
      <section
        className="flex flex-col items-center rounded-xl border border-line bg-surface p-6 sm:col-span-2"
        aria-label="Cronômetro de sessão de estudo"
      >
        {/* Abas de modo (pill) */}
        <div
          role="tablist"
          aria-label="Modo de estudo"
          className="mb-6 flex w-full rounded-lg bg-subtle p-1 sm:w-auto"
        >
          {(["livre", "pomodoro"] as Mode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={cn(
                "flex-1 rounded-md px-5 py-2 text-sm font-medium transition-colors sm:flex-none",
                mode === m
                  ? "bg-indigo-soft text-indigo"
                  : "text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]"
              )}
            >
              {m === "livre" ? "Cronômetro livre" : "Pomodoro"}
            </button>
          ))}
        </div>
        {mode === "pomodoro" && (
          <p className="-mt-4 mb-5 text-xs text-[hsl(var(--text-secondary))]">
            25 min de foco / 5 min de pausa curta
          </p>
        )}

        {/* Rótulo de status e ruído: contexto atual */}
        <p className="text-sm font-medium text-[hsl(var(--text-secondary))]" aria-live="polite">
          {statusLabel()}
        </p>
        <p className="mt-1 text-center text-sm text-[hsl(var(--text-secondary))]">
          {discipline} • {topic}
          <span className="mx-1.5 text-[hsl(var(--text-muted))]">|</span>
          {objective.name}
        </p>

        {/* Mostrador */}
        <div className="my-6 flex flex-col items-center gap-3">
          {mode === "pomodoro" && (
            <span
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold",
                phase === "foco"
                  ? "bg-indigo-soft text-indigo"
                  : "bg-success/10 text-success"
              )}
            >
              {phase === "foco" ? "Foco" : "Pausa"} • {formatClock(phase === "foco" ? focusSeconds : breakSeconds)}
            </span>
          )}
          <span
            aria-live={status === "running" ? "off" : "polite"}
            className="font-sans text-6xl font-semibold tabular-nums tracking-tight text-[hsl(var(--text-primary))] sm:text-7xl"
          >
            {mode === "livre" ? formatClock(phaseSeconds) : formatClock(Math.max((phase === "foco" ? focusSeconds : breakSeconds) - phaseSeconds, 0))}
          </span>
          {mode === "pomodoro" && (
            <>
              <div
                className="h-2 w-64 max-w-full overflow-hidden rounded-full bg-[hsl(var(--bg-subtle))]"
                role="progressbar"
                aria-valuenow={Math.round((phaseSeconds / (phase === "foco" ? focusSeconds : breakSeconds)) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progresso da fase ${phase}: ${
                  Math.round((phaseSeconds / (phase === "foco" ? focusSeconds : breakSeconds)) * 100)
                }%`}
              >
                <div
                  className={cn("h-full rounded-full transition-all", phase === "foco" ? "bg-indigo" : "bg-success")}
                  style={{
                    width: `${Math.min(100, (phaseSeconds / (phase === "foco" ? focusSeconds : breakSeconds)) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5" aria-label={`Ciclos concluídos: ${cycles} de ${POMODORO_CYCLES}`}>
                {Array.from({ length: POMODORO_CYCLES }).map((_, i) => (
                  <span
                    key={i}
                    aria-hidden
                    title={i < cycles ? "Ciclo concluído" : "Ciclo pendente"}
                    className={cn("h-2.5 w-2.5 rounded-full", i < cycles ? "bg-indigo" : "bg-[hsl(var(--border))]")}
                  />
                ))}
                <span className="ml-1.5 text-xs text-[hsl(var(--text-secondary))]">
                  {cycles}/{POMODORO_CYCLES} ciclos
                </span>
              </div>
            </>
          )}
        </div>

        {/* Controles */}
        <div className="flex flex-wrap items-center justify-center gap-3 pb-5">
          {status === "idle" && (
            <button
              type="button"
              onClick={() => setStatus("running")}
              aria-label={`Iniciar cronômetro de ${discipline}: ${topic}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo px-5 text-sm font-medium text-white hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-app"
            >
              <Play className="h-4 w-4" aria-hidden />
              Iniciar
            </button>
          )}
          {status === "running" && (
            <>
              <button
                type="button"
                onClick={() => setStatus("paused")}
                aria-label="Pausar cronômetro"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-5 text-sm font-medium text-[hsl(var(--text-primary))] hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
              >
                <Pause className="h-4 w-4" aria-hidden />
                Pausar
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                aria-label="Finalizar sessão de estudo"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo px-5 text-sm font-medium text-white hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-app"
              >
                <Square className="h-4 w-4" aria-hidden />
                Finalizar
              </button>
            </>
          )}
          {status === "paused" && (
            <>
              <button
                type="button"
                onClick={() => setStatus("running")}
                aria-label="Retomar cronômetro"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo px-5 text-sm font-medium text-white hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-app"
              >
                <CirclePlay className="h-4 w-4" aria-hidden />
                Retomar
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                aria-label="Finalizar sessão de estudo"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-5 text-sm font-medium text-[hsl(var(--text-primary))] hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
              >
                <Square className="h-4 w-4" aria-hidden />
                Finalizar
              </button>
            </>
          )}
          {canFinish && status !== "running" && (
            <button
              type="button"
              onClick={resetRun}
              aria-label="Reiniciar cronômetro"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-[hsl(var(--text-secondary))] hover:bg-subtle hover:text-[hsl(var(--text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reiniciar
            </button>
          )}
        </div>

        {/* Anotações */}
        <div
          className="w-full border-t border-[hsl(var(--border))] pt-5"
          aria-label="Anotações da sessão"
        >
          <label
            htmlFor="anotacoes"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[hsl(var(--text-secondary))]"
          >
            Anotações da sessão
          </label>
          <textarea
            id="anotacoes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Registre dúvidas, ideias ou pontos para revisar..."
            rows={3}
            className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
          />
          <p className="mt-1 text-xs text-[hsl(var(--text-muted))]" aria-live="polite">
            {hasNotes ? "Anotação salva localmente." : "As anotações ficam apenas neste dispositivo."}
          </p>
        </div>
      </section>

      {/* Configuração da sessão: seletores dependentes */}
      <section className="rounded-xl border border-line bg-surface p-5" aria-labelledby="titulo-config-sessao">
        <h2 id="titulo-config-sessao" className="text-base font-semibold text-[hsl(var(--text-primary))]">
          Configurar sessão
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          <Select
            id="obj-objetivo"
            label="Objetivo"
            icon={<Target className="h-4 w-4 text-indigo" aria-hidden />}
            value={objectiveIdx}
            onChange={(e) => changeObjective(Number(e.target.value))}
          >
            {objectivesTree.map((o, i) => (
              <option key={o.name} value={i}>
                {o.name}
              </option>
            ))}
          </Select>
          <Select
            id="sel-disciplina"
            label="Disciplina"
            icon={<BookOpen className="h-4 w-4 text-indigo" aria-hidden />}
            value={discipline}
            onChange={(e) => changeDiscipline(e.target.value)}
          >
            {disciplines.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select
            id="sel-assunto"
            label="Assunto"
            icon={<ListTree className="h-4 w-4 text-indigo" aria-hidden />}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <p className="rounded-lg bg-subtle p-3 text-xs leading-snug text-[hsl(var(--text-secondary))]">
            O tempo registrado aqui é demonstrativo e não é salvo no servidor.
          </p>
        </div>
      </section>

      {/* Histórico recente */}
      <section
        className="rounded-xl border border-line bg-surface p-5 sm:col-span-2"
        aria-labelledby="titulo-historico"
      >
        <h2 id="titulo-historico" className="mb-2 text-base font-semibold text-[hsl(var(--text-primary))]">
          Histórico recente
        </h2>
        {history.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line p-8 text-center text-sm text-[hsl(var(--text-secondary))]">
            Nenhuma sessão registrada ainda — inicie seu primeiro estudo hoje.
          </div>
        ) : (
          <ul className="divide-y divide-[hsl(var(--border))]">
            {history.map((s) => (
              <li key={`${s.subject}-${s.topic}-${s.when}`} className="flex items-center gap-3 py-2.5">
                <span
                  aria-hidden
                  className="h-9 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: s.marker }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[hsl(var(--text-primary))]">
                    {s.subject}
                    <span className="text-[hsl(var(--text-secondary))]"> • {s.topic}</span>
                  </p>
                  <p className="truncate text-xs text-[hsl(var(--text-secondary))]">
                    {s.when} • {s.mode}
                  </p>
                </div>
                <Badge
                  label={
                    s.status === "concluida"
                      ? "Finalizada"
                      : s.status === "pausada"
                        ? "Pausada"
                        : s.status === "nao-iniciada"
                          ? "Não iniciada"
                          : "Em andamento"
                  }
                  tone={
                    s.status === "concluida"
                      ? "done"
                      : s.status === "pausada" || s.status === "em-andamento"
                        ? "in_progress"
                        : "neutral"
                  }
                />
                <span className="w-20 shrink-0 text-right text-sm font-medium tabular-nums text-[hsl(var(--text-secondary))]">
                  {s.duration}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modal de confirmação ao finalizar */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Finalizar sessão?">
        <p>
          O tempo registrado ({formatDuration(totalSeconds)}) será adicionado às suas estatísticas.
          A anotação desta sessão não será enviada a lugar nenhum.
        </p>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-[hsl(var(--text-primary))] hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo px-4 text-sm font-medium text-white hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-app"
          >
            Finalizar sessão
          </button>
        </div>
      </Dialog>

      {/* Feedback demonstrativo */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </div>
    </div>
  );
}
