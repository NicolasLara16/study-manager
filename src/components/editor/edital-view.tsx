"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CloudUpload,
  FileText,
  ShieldCheck,
  ChevronRight,
  ListChecks,
  Compass,
  CalendarPlus,
  PencilLine,
  CircleCheck,
} from "lucide-react";
import { Toast } from "@/components/ui/toast";
import {
  editalExampleFile,
  editalExampleMeta,
  editalSummary,
  editalDisciplines,
} from "@/lib/mock-stats";
import { cn } from "@/lib/utils";

type Phase = "idle" | "uploading" | "processing" | "ready";

export function EditalView() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Máquina de estados simulada: progresso do "upload" → processamento → pronto */
  useEffect(() => {
    if (phase !== "uploading" && phase !== "processing") return;

    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (phase === "uploading") {
      [0, 22, 47, 74, 96, 100].forEach((v, i) => {
        timers.current.push(
          setTimeout(() => {
            setProgress(v);
            if (v === 100) {
              timers.current.push(setTimeout(() => setPhase("processing"), 350));
            }
          }, i * 420)
        );
      });
    } else {
      timers.current.push(
        setTimeout(() => {
          setPhase("ready");
          setToast("Arquivo processado — revise as informações extraídas.");
          timers.current.push(setTimeout(() => setToast(null), 4000));
        }, 1400)
      );
    }

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [phase]);

  function reset() {
    setPhase("idle");
    setProgress(0);
    setFileName(null);
    setDragActive(false);
  }

  function startAnalysis(file = editalExampleFile) {
    setFileName(file);
    setProgress(0);
    setPhase("uploading");
  }

  function handleFakeFilePick() {
    fileInputRef.current?.click();
  }

  function showToast(msg: string) {
    setToast(null);
    requestAnimationFrame(() => setToast(msg));
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--text-primary))]">
            Analisador de edital
          </h1>
          <p className="mt-1 max-w-lg text-sm text-[hsl(var(--text-secondary))]">
            Transforme um PDF extenso em um plano de estudos revisável.
          </p>
        </div>
        {phase === "ready" && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
            <CircleCheck className="h-3.5 w-3.5" aria-hidden />
            Processado
          </span>
        )}
      </header>

      {phase !== "ready" && (
        <section
          aria-labelledby="titulo-envio"
          onDragOver={(e) => {
            e.preventDefault();
            if (phase === "idle") setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (phase === "idle") startAnalysis(editalExampleFile);
          }}
          className={cn(
            "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-surface p-10 text-center transition-colors",
            dragActive ? "border-indigo bg-indigo-soft/40" : "border-line",
            phase !== "idle" && "bg-subtle/50"
          )}
        >
          <h2 id="titulo-envio" className="sr-only">
            Envio do edital
          </h2>

          {phase === "idle" && (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-soft text-indigo">
                <CloudUpload className="h-6 w-6" aria-hidden />
              </span>
              <p className="text-sm font-medium text-[hsl(var(--text-primary))]">
                Arraste seu edital em PDF
              </p>
              <p className="text-xs text-[hsl(var(--text-secondary))]">
                ou selecione um arquivo de até 20 MB
              </p>
              <button
                type="button"
                onClick={handleFakeFilePick}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-[hsl(var(--text-primary))] hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
              >
                <FileText className="h-4 w-4" aria-hidden />
                Selecionar arquivo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="sr-only"
                aria-label="Selecionar PDF do edital (seleção demonstrativa)"
                onChange={() => startAnalysis()}
              />
              <p className="text-[11px] text-[hsl(var(--text-muted))]">
                Demonstração: a seleção abre o exemplo &quot;edital-banco-do-brasil-2026.pdf&quot; sem
                acessar nada do seu computador.
              </p>
            </>
          )}

          {(phase === "uploading" || phase === "processing") && (
            <div className="flex w-full max-w-lg flex-col gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-soft text-indigo">
                {phase === "uploading" ? (
                  <CloudUpload className="h-6 w-6 animate-pulse" aria-hidden />
                ) : (
                  <FileText className="h-6 w-6 animate-pulse" aria-hidden />
                )}
              </span>
              <p
                className="truncate text-sm font-medium text-[hsl(var(--text-primary))]"
                aria-live="polite"
              >
                {fileName} — {phase === "uploading" ? "enviando…" : "analisando conteúdo do PDF…"}
                {phase === "uploading" && (
                  <span className="ml-1 font-normal text-[hsl(var(--text-secondary))]">{progress}%</span>
                )}
              </p>
              <div
                className="h-2.5 w-full overflow-hidden rounded-full bg-[hsl(var(--bg-subtle))]"
                role="progressbar"
                aria-valuenow={phase === "uploading" ? progress : undefined}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={phase === "uploading" ? "Progresso do envio" : "Analisando edital"}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    phase === "uploading" ? "bg-indigo" : "bg-indigo animate-pulse"
                  )}
                  style={{ width: phase === "uploading" ? `${progress}%` : "100%" }}
                />
              </div>
              <button
                type="button"
                onClick={reset}
                aria-label="Cancelar análise"
                className="self-center text-xs font-medium text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]"
              >
                Cancelar
              </button>
            </div>
          )}
        </section>
      )}

      {phase === "ready" && (
        <>
          {/* Card do arquivo carregado */}
          <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-soft text-indigo">
                <FileText className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium text-[hsl(var(--text-primary))]">{fileName}</p>
                <p className="text-xs text-[hsl(var(--text-secondary))]">{editalExampleMeta}</p>
              </div>
              <CircleCheck className="h-5 w-5 text-success" aria-label="Arquivo processado com sucesso" />
            </div>
            <button
              type="button"
              onClick={reset}
              aria-label="Analisar outro edital"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-line bg-surface px-3 text-xs font-medium text-[hsl(var(--text-primary))] hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
            >
              Analisar outro edital
            </button>
          </div>

          {/* Aviso de revisão / confiança */}
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl border border-indigo/40 bg-indigo-soft/50 p-3.5 text-xs leading-relaxed text-[hsl(var(--text-secondary))] dark:bg-indigo-soft/20"
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-indigo" aria-hidden />
            <p>
              Revise os dados extraídos antes de criar seu objetivo. Nenhuma informação é
              confirmada automaticamente.
            </p>
          </div>

          {/* Dados extraídos */}
          <section aria-labelledby="titulo-revisao">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 id="titulo-revisao" className="text-base font-semibold text-[hsl(var(--text-primary))]">
                Revise as informações extraídas
              </h2>
              <button
                type="button"
                onClick={() => showToast("Demonstração: edição manual da extração viria aqui.")}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-indigo hover:bg-indigo-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
              >
                <PencilLine className="h-3.5 w-3.5" aria-hidden />
                Editar extração
              </button>
            </div>

            {/* Resumo do concurso */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {editalSummary.map((card) => (
                <div key={card.label} className="rounded-xl border border-line bg-surface p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--text-muted))]">
                    {card.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[hsl(var(--text-primary))]">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Conteúdo programático */}
            <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--text-secondary))]">
              Conteúdo programático • {editalDisciplines.length} disciplinas identificadas
            </p>
            <div className="rounded-xl border border-line bg-surface">
              <ul className="divide-y divide-[hsl(var(--border))]">
                {editalDisciplines.map((d, idx) => {
                  const open = expanded === idx;
                  return (
                    <li key={d.name}>
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={`painel-disciplina-${idx}`}
                        onClick={() => setExpanded(open ? null : idx)}
                        className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo"
                      >
                        <ChevronRight
                          aria-hidden
                          className={cn(
                            "h-4 w-4 shrink-0 text-[hsl(var(--text-muted))] transition-transform",
                            open && "rotate-90"
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[hsl(var(--text-primary))]">
                            {d.name}
                          </span>
                          <span className="block truncate text-xs text-[hsl(var(--text-secondary))]">
                            {d.description}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-md bg-indigo-soft px-2 py-0.5 text-[11px] font-semibold text-indigo">
                          {d.questions} questões
                        </span>
                      </button>
                      <div
                        id={`painel-disciplina-${idx}`}
                        hidden={!open}
                        className="border-t border-[hsl(var(--border))] px-5 py-3"
                      >
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--text-muted))]">
                          Tópicos sugeridos
                        </p>
                        <ul className="flex flex-wrap gap-2">
                          {d.topics.map((t) => (
                            <li
                              key={t}
                              className="rounded-lg bg-subtle px-2.5 py-1 text-xs text-[hsl(var(--text-secondary))]"
                            >
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* CTAs da análise */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/explorar"
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-[hsl(var(--text-primary))] hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
            >
              <Compass className="h-4 w-4" aria-hidden />
              Encontrar materiais do edital
            </Link>
            <button
              type="button"
              onClick={() => showToast("Disciplinas do edital adicionadas ao plano da próxima semana.")}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-[hsl(var(--text-primary))] hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden />
              Adicionar ao planejamento
            </button>
            <button
              type="button"
              onClick={() => showToast("Objetivo \"Banco do Brasil 2026\" criado — veja em Objetivos.")}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-indigo px-4 text-sm font-medium text-white hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-app"
            >
              <ListChecks className="h-4 w-4" aria-hidden />
              Criar objetivo do edital
            </button>
          </div>
        </>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
