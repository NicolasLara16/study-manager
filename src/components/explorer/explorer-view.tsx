"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  CirclePlay,
  FileText,
  Newspaper,
  Play,
  Search,
  type LucideIcon,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { useSavedMaterials } from "@/components/library/saved-context";
import {
  materialsData,
  disciplinesCatalog,
  typeLabel,
  type Material,
  type MaterialType,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const typeIcon: Record<MaterialType, LucideIcon> = {
  video: CirclePlay,
  course: CirclePlay,
  pdf: FileText,
  article: Newspaper,
};

const disciplineOptions = ["Todas", ...disciplinesCatalog.map((d) => d.name)];
const subjectOptions = ["Todos", "Funções", "Trigonometria", "Mecânica", "Genética", "Gramática", "Literatura", "Lógica", "Python"];
const levelOptions = ["Todos", "Iniciante", "Intermediário", "Avançado"];
const languageOptions = ["Todos", "Português", "Inglês"];
const durationOptions = ["Qualquer", "Curta (até 30 min)", "Média (30–90 min)", "Longa (mais de 90 min)"];
const sortOptions = ["Mais relevantes", "Melhor avaliados", "Mais recentes"];

function MaterialCard({ material }: { material: Material }) {
  const { isSaved, toggleSave } = useSavedMaterials();
  const [toast, setToast] = useState<string | null>(null);
  const Icon = typeIcon[material.type];
  const saved = isSaved(material.id);

  function handleSave() {
    const nowSaved = toggleSave(material.id);
    setToast(nowSaved ? "Material salvo na biblioteca" : "Material removido da biblioteca");
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      {/* Miniatura */}
      <Link
        href={`/explorar/${material.id}`}
        aria-label={`Ver detalhes de ${material.title}`}
        className="flex h-28 w-full items-center justify-center bg-indigo-soft/70 dark:bg-indigo-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface/90 text-indigo shadow-sm">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link
          href={`/explorar/${material.id}`}
          className="line-clamp-2 text-sm font-semibold text-[hsl(var(--text-primary))] hover:text-indigo"
        >
          {material.title}
        </Link>
        <p className="mt-1 truncate text-xs text-[hsl(var(--text-secondary))]">
          {material.source} • {typeLabel[material.type]} • {material.duration}
        </p>

        <div className="mt-3 flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleSave}
            aria-pressed={saved}
            aria-label={saved ? `Remover ${material.title} da biblioteca` : `Salvar ${material.title} na biblioteca`}
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo",
              saved ? "border-indigo bg-indigo-soft text-indigo" : "border-line text-[hsl(var(--text-secondary))] hover:bg-subtle"
            )}
          >
            {saved ? <BookmarkCheck className="h-4 w-4 fill-current" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}
          </button>
          <Link
            href="/estudo"
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-3 text-xs font-medium text-[hsl(var(--text-primary))] hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
          >
            <Play className="h-3.5 w-3.5" aria-hidden />
            Estudar agora
          </Link>
        </div>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </article>
  );
}

export function ExplorerView() {
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [discipline, setDiscipline] = useState("Todas");
  const [subject, setSubject] = useState("Todos");
  const [type, setType] = useState("Todos");
  const [level, setLevel] = useState("Todos");
  const [language, setLanguage] = useState("Todos");
  const [duration, setDuration] = useState("Qualquer");
  const [sort, setSort] = useState("Mais relevantes");
  const [toast, setToast] = useState<string | null>(null);

  const results = useMemo(() => {
    let list = materialsData.filter((m) => {
      const q = appliedQuery.trim().toLowerCase();
      if (q && !(`${m.title} ${m.subjects.join(" ")}`.toLowerCase().includes(q))) return false;
      if (discipline !== "Todas" && m.discipline !== discipline) return false;
      if (subject !== "Todos" && !m.subjects.includes(subject)) return false;
      if (type !== "Todos" && typeLabel[m.type] !== type.replace(/s$/, "")) return false;
      if (level !== "Todos" && m.level !== level) return false;
      if (language !== "Todos" && m.language !== language) return false;
      if (duration === "Curta (até 30 min)" && m.minutes > 30) return false;
      if (duration === "Média (30–90 min)" && (m.minutes <= 30 || m.minutes > 90)) return false;
      if (duration === "Longa (mais de 90 min)" && m.minutes <= 90) return false;
      return true;
    });

    if (sort === "Melhor avaliados") {
      list = [...list].sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0) * 0);
      list = [...list].sort((a, b) => parseFloat(b.rating.replace(",", ".")) - parseFloat(a.rating.replace(",", ".")));
    } else if (sort === "Mais recentes") {
      list = [...list].reverse();
    }
    return list;
  }, [appliedQuery, discipline, subject, type, level, language, duration, sort]);

  const hasActiveFilters =
    discipline !== "Todas" || subject !== "Todos" || type !== "Todos" || level !== "Todos" || language !== "Todos" || duration !== "Qualquer";

  function clearFilters() {
    setDiscipline("Todas");
    setSubject("Todos");
    setType("Todos");
    setLevel("Todos");
    setLanguage("Todos");
    setDuration("Qualquer");
    setAppliedQuery("");
    setQuery("");
    setToast("Filtros limpos");
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho + busca principal */}
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--text-primary))]">
            Explorar conteúdos
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--text-secondary))]">
            Conteúdos gratuitos e curados das melhores plataformas para cada objetivo.
          </p>
        </div>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setAppliedQuery(query);
          }}
        >
          <label htmlFor="buscar-conteudo" className="sr-only">
            O que você quer aprender hoje?
          </label>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--text-muted))]" aria-hidden />
            <input
              id="buscar-conteudo"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que você quer aprender hoje?"
              className="h-11 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo px-5 text-sm font-medium text-white hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-app"
          >
            Pesquisar
          </button>
        </form>
      </header>

      {/* Filtros combináveis */}
      <section
        aria-label="Filtros de busca"
        className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-3 lg:grid-cols-7"
      >
        <Select id="f-disc" label="Disciplina" value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
          {disciplineOptions.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Select>
        <Select id="f-assunto" label="Assunto" value={subject} onChange={(e) => setSubject(e.target.value)}>
          {subjectOptions.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Select>
        <Select id="f-tipo" label="Tipo" value={type} onChange={(e) => setType(e.target.value)}>
          {["Todos", "Vídeos", "Artigos", "PDFs", "Cursos"].map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Select>
        <Select id="f-nivel" label="Nível" value={level} onChange={(e) => setLevel(e.target.value)}>
          {levelOptions.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Select>
        <Select id="f-idioma" label="Idioma" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {languageOptions.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Select>
        <Select id="f-duracao" label="Duração" value={duration} onChange={(e) => setDuration(e.target.value)}>
          {durationOptions.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Select>
        <Select id="f-ordena" label="Ordenação" value={sort} onChange={(e) => setSort(e.target.value)}>
          {sortOptions.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Select>
      </section>

      {/* Explorar por disciplina */}
      <section aria-labelledby="titulo-explorar-disciplina">
        <h2 id="titulo-explorar-disciplina" className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--text-secondary))]">
          Explorar por disciplina
        </h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-7 md:overflow-visible">
          {disciplinesCatalog.map((d) => {
            const active = discipline === d.name;
            return (
              <button
                key={d.name}
                type="button"
                onClick={() => setDiscipline(active ? "Todas" : d.name)}
                aria-pressed={active}
                className={cn(
                  "min-w-[9rem] shrink-0 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo",
                  active ? "border-indigo bg-indigo-soft/50" : "border-line bg-surface hover:bg-subtle"
                )}
              >
                <span
                  aria-hidden
                  className="block h-1 w-8 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <p className="mt-2 text-sm font-medium text-[hsl(var(--text-primary))]">{d.name}</p>
                <p className="text-xs text-[hsl(var(--text-secondary))]">{d.count} materiais</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Resultados */}
      <section aria-labelledby="titulo-resultados">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="titulo-resultados" className="text-base font-semibold text-[hsl(var(--text-primary))]">
            {hasActiveFilters || appliedQuery ? "Materiais encontrados" : "Recomendados para você"}
            <span className="ml-2 text-sm font-normal text-[hsl(var(--text-secondary))]">
              ({results.length})
            </span>
          </h2>
        </div>

        {results.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface p-12 text-center">
            <p className="text-sm font-medium text-[hsl(var(--text-primary))]">
              Nenhum material encontrado
            </p>
            <p className="max-w-sm text-xs text-[hsl(var(--text-secondary))]">
              Tente remover alguns filtros ou buscar por outro termo — temos {materialsData.length} materiais demonstrativos no catálogo.
            </p>
            {(hasActiveFilters || appliedQuery) && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo px-4 text-sm font-medium text-white hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-app"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((m) => (
              <MaterialCard key={m.id} material={m} />
            ))}
          </div>
        )}
      </section>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
