"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Bookmark, BookmarkCheck, Compass } from "lucide-react";
import { Toast } from "@/components/ui/toast";
import { libraryData, type LibraryItem, type LibraryStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Tab = "todos" | "nao-iniciado" | "em-andamento" | "concluido" | "favoritos";

const tabConfigs: Array<{ key: Tab; label: string }> = [
  { key: "todos", label: "Todos" },
  { key: "nao-iniciado", label: "Não iniciados" },
  { key: "em-andamento", label: "Em andamento" },
  { key: "concluido", label: "Concluídos" },
  { key: "favoritos", label: "Favoritos" },
];

const statusLabel: Record<LibraryStatus, { text: string; className: string }> = {
  "nao-iniciado": { text: "Não iniciado", className: "bg-subtle text-[hsl(var(--text-secondary))]" },
  "em-andamento": { text: "Em andamento", className: "bg-indigo-soft text-indigo" },
  concluido: { text: "Concluído", className: "bg-success/10 text-success" },
};

function LibraryCard({ item, showToast }: { item: LibraryItem; showToast: (msg: string) => void }) {
  const [favorite, setFavorite] = useState(item.favorite);

  function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    showToast(next ? "Marcado como favorito." : "Favorito removido.");
  }

  const status = statusLabel[item.status];

  return (
    <article className="flex gap-4 rounded-xl border border-line bg-surface p-4 transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      {/* Miniatura com ícone de livro */}
      <Link
        href={`/explorar/${item.material.id}`}
        aria-label={`Ver detalhes de ${item.material.title}`}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-indigo-soft/70 text-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo xl:h-20 xl:w-20"
      >
        <BookOpen className="h-6 w-6" aria-hidden />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/explorar/${item.material.id}`}
              className="line-clamp-1 text-sm font-semibold text-[hsl(var(--text-primary))] hover:text-indigo"
            >
              {item.material.title}
            </Link>
            <p className="truncate text-xs text-[hsl(var(--text-secondary))]">{item.material.source}</p>
          </div>
          <button
            type="button"
            onClick={toggleFavorite}
            aria-pressed={favorite}
            aria-label={favorite ? `Remover ${item.material.title} dos favoritos` : `Favoritar ${item.material.title}`}
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo",
              favorite ? "border-indigo bg-indigo-soft text-indigo" : "border-line text-[hsl(var(--text-muted))] hover:bg-subtle"
            )}
          >
            {favorite ? (
              <BookmarkCheck className="h-4 w-4 fill-current" aria-hidden />
            ) : (
              <Bookmark className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold", status.className)}>
            {status.text}
          </span>
          <span className="text-xs font-medium tabular-nums text-[hsl(var(--text-secondary))]">
            {item.progress}%
          </span>
        </div>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--bg-subtle))]"
          role="progressbar"
          aria-valuenow={item.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progresso de ${item.material.title}: ${item.progress}%`}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all",
              item.status === "concluido" ? "bg-success" : "bg-indigo"
            )}
            style={{ width: `${item.progress}%` }}
          />
        </div>
      </div>
    </article>
  );
}

export function LibraryView() {
  const [tab, setTab] = useState<Tab>("todos");
  const [items, setItems] = useState<LibraryItem[]>(libraryData);
  void setItems;
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(null);
    requestAnimationFrame(() => setToast(msg));
  }

  /* Favoritar altera o estado local da lista (persistência apenas local) */

  const counts = useMemo(() => {
    const count = (fn: (i: LibraryItem) => boolean) => items.filter(fn).length;
    return {
      todos: items.length,
      "nao-iniciado": count((i) => i.status === "nao-iniciado"),
      "em-andamento": count((i) => i.status === "em-andamento"),
      concluido: count((i) => i.status === "concluido"),
      favoritos: count((i) => i.favorite),
    } as Record<Tab, number>;
  }, [items]);

  const results = useMemo(() => {
    const q = appliedQuery.trim().toLowerCase();
    return items.filter((i) => {
      if (tab === "favoritos" ? !i.favorite : tab !== "todos" && i.status !== (tab as LibraryStatus)) return false;
      if (q && !(`${i.material.title} ${i.material.source}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [items, tab, appliedQuery]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho + busca interna */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--text-primary))]">
            Meus materiais
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--text-secondary))]">
            Tudo o que você salvou, organizado pelo seu progresso.
          </p>
        </div>
        <form
          className="sm:w-72"
          onSubmit={(e) => {
            e.preventDefault();
            setAppliedQuery(query);
          }}
        >
          <label htmlFor="bib-busca" className="sr-only">
            Buscar na biblioteca
          </label>
          <input
            id="bib-busca"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar material na biblioteca..."
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
          />
        </form>
      </header>

      {/* Abas de filtro */}
      <div
        role="tablist"
        aria-label="Filtro da biblioteca"
        className="inline-flex w-full gap-1 rounded-xl bg-subtle p-1 md:w-auto"
      >
        {tabConfigs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
              tab === t.key
                ? "bg-indigo-soft text-indigo"
                : "text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]"
            )}
          >
            {t.label}
            <span className="ml-1.5 text-[10px] opacity-70">({counts[t.key]})</span>
          </button>
        ))}
      </div>

      {/* Grade de cards */}
      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface p-12 text-center">
          <p className="text-sm font-medium text-[hsl(var(--text-primary))]">
            Nada aqui ainda
          </p>
          <p className="max-w-sm text-xs text-[hsl(var(--text-secondary))]">
            {appliedQuery
              ? "Nenhum material corresponde à busca nesta aba."
              : "Salve conteúdos no Explorar e acompanhe seu progresso por aqui."}
          </p>
          <Link
            href="/explorar"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo px-4 text-sm font-medium text-white hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-app"
          >
            <Compass className="h-4 w-4" aria-hidden />
            Explorar materiais
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {results.map((i) => (
            <LibraryCard key={`${i.material.id}-${i.status}`} item={i} showToast={showToast} />
          ))}
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
