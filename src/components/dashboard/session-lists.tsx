import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { recentSessions, upcomingSessions, type StudySession } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function SessionRow({ session }: { session: StudySession }) {
  return (
    <li className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-subtle">
      {/* Marcador colorido lateral da matéria */}
      <span
        aria-hidden
        className="h-9 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: session.marker }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[hsl(var(--text-primary))]">
          {session.subject}
          <span className="text-[hsl(var(--text-secondary))]"> • {session.topic}</span>
        </p>
        <p className="truncate text-xs text-[hsl(var(--text-secondary))]">
          {session.when} • {session.mode}
        </p>
      </div>
      <span className="shrink-0 text-sm font-medium tabular-nums text-[hsl(var(--text-secondary))]">
        {session.duration}
      </span>
      <button
        type="button"
        aria-label={`Opções da sessão ${session.subject}: ${session.topic}`}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[hsl(var(--text-muted))] opacity-0 transition-opacity hover:bg-app focus-visible:opacity-100 group-hover:opacity-100"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>
    </li>
  );
}

export function RecentSessions() {
  return (
    <section className="flex flex-col rounded-xl border border-line bg-surface p-5" aria-labelledby="titulo-sessoes-recentes">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="titulo-sessoes-recentes" className="text-base font-semibold text-[hsl(var(--text-primary))]">
          Sessões recentes
        </h2>
        <Link
          href="/estatisticas"
          className="text-sm font-medium text-indigo hover:underline"
        >
          Ver histórico
        </Link>
      </div>
      <ul className="divide-y divide-[hsl(var(--border))]">
        {recentSessions.map((s) => (
          <SessionRow key={`${s.subject}-${s.topic}`} session={s} />
        ))}
      </ul>
    </section>
  );
}

export function UpcomingSessions() {
  return (
    <section className="flex flex-col rounded-xl border border-line bg-surface p-5" aria-labelledby="titulo-proximas-sessoes">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="titulo-proximas-sessoes" className="text-base font-semibold text-[hsl(var(--text-primary))]">
          Próximas sessões
        </h2>
        <Link
          href="/planejamento"
          className="text-sm font-medium text-indigo hover:underline"
        >
          Ver planejamento
        </Link>
      </div>
      <ul className="divide-y divide-[hsl(var(--border))]">
        {upcomingSessions.map((s) => (
          <SessionRow key={`${s.subject}-${s.topic}`} session={s} />
        ))}
      </ul>
    </section>
  );
}
