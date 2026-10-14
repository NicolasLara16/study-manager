"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CirclePlay,
  Star,
  ShieldCheck,
  ArrowUpRight,
  Play,
  CircleCheck,
} from "lucide-react";
import { useState } from "react";
import { Toast } from "@/components/ui/toast";
import { useSavedMaterials } from "@/components/library/saved-context";
import { typeLabel, type Material } from "@/lib/mock-data";

export function MaterialDetailView({ material }: { material: Material }) {
  const { isSaved, toggleSave } = useSavedMaterials();
  const [toast, setToast] = useState<string | null>(null);
  const saved = isSaved(material.id);

  const metadata = [
    { label: "Formato", value: material.format },
    { label: "Duração", value: material.duration },
    { label: "Nível", value: material.level },
    { label: "Idioma", value: material.language },
    { label: "Avaliação", value: material.rating, icon: <Star className="h-4 w-4 text-amber-500" aria-hidden /> },
  ];

  function handleSave() {
    const nowSaved = toggleSave(material.id);
    setToast(nowSaved ? "Material salvo na biblioteca" : "Material removido da biblioteca");
  }

  return (
    <div className="space-y-6">
      {/* Voltar */}
      <Link
        href="/explorar"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo rounded-lg px-1"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Voltar aos resultados
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Coluna principal */}
        <div className="space-y-6 lg:col-span-3">
          <header className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-soft px-2.5 py-1 text-xs font-semibold text-indigo">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              {material.verified ? "Fonte verificada • " : ""}
              {material.source}
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--text-primary))]">
              {material.title}
            </h1>
            <p className="text-sm leading-relaxed text-[hsl(var(--text-secondary))]">
              {material.description}
            </p>
          </header>

          {/* Player demonstrativo */}
          <section
            aria-label="Prévia do material"
            className="relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-line bg-gradient-to-br from-indigo-soft to-[hsl(var(--bg-subtle))] dark:from-indigo-soft/40 dark:to-[hsl(var(--bg-subtle))]"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo text-white shadow-lg">
              <Play className="h-7 w-7 fill-current" aria-hidden />
            </span>
            <p className="mt-3 text-sm font-medium text-[hsl(var(--text-secondary))]">
              Prévia do curso • 2 min
            </p>
            <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
              Player demonstrativo
            </span>
          </section>

          {/* Sobre este material */}
          <section
            aria-labelledby="titulo-sobre-material"
            className="rounded-xl border border-line bg-subtle/50 p-4"
          >
            <h2 id="titulo-sobre-material" className="flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--text-primary))]">
              <CircleCheck className="h-4 w-4 text-indigo" aria-hidden />
              Sobre este material
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[hsl(var(--text-secondary))]">
              Este conteúdo vem do catálogo aberto {material.source}. A curadoria do {""}
              Study Manager prioriza materiais gratuitos alinhados ao seu objetivo ativo — nada aqui
              é pago e nenhum vídeo é armazenado por nós: ao estudar, o cronômetro registra
              localmente apenas o tempo das suas sessões.
            </p>
          </section>

          {/* Ações */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/estudo?disciplina=${encodeURIComponent(material.discipline)}&assunto=${encodeURIComponent(material.subjects[0])}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo px-5 text-sm font-medium text-white hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-app"
            >
              <CirclePlay className="h-4 w-4" aria-hidden />
              Estudar material agora
            </Link>
            <a
              href={material.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Acessar conteúdo original de ${material.title} (abre em nova aba)`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-5 text-sm font-medium text-[hsl(var(--text-primary))] hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
            >
              <ArrowUpRight className="h-4 w-4" aria-hidden />
              Acessar conteúdo original
            </a>
            <button
              type="button"
              onClick={handleSave}
              aria-pressed={saved}
              aria-label={saved ? `Remover ${material.title} da biblioteca` : `Salvar ${material.title} na biblioteca`}
              className={
                saved
                  ? "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-indigo bg-indigo-soft px-5 text-sm font-medium text-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
                  : "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-5 text-sm font-medium text-[hsl(var(--text-primary))] hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
              }
            >
              {saved ? (
                <BookmarkCheck className="h-4 w-4 fill-current" aria-hidden />
              ) : (
                <Bookmark className="h-4 w-4" aria-hidden />
              )}
              {saved ? "Salvo na biblioteca" : "Salvar na biblioteca"}
            </button>
          </div>
        </div>

        {/* Metadados + assuntos */}
        <aside className="space-y-4 lg:col-span-2">
          <section aria-label="Metadados do material" className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold text-[hsl(var(--text-primary))]">Detalhes</h2>
            <dl className="mt-3 grid grid-cols-2 gap-4">
              {metadata.map((item) => (
                <div key={item.label} className="rounded-lg bg-subtle p-3">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-[hsl(var(--text-muted))]">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 flex items-center gap-1 text-sm font-medium text-[hsl(var(--text-primary))]">
                    {item.icon}
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-label="Assuntos relacionados" className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold text-[hsl(var(--text-primary))]">Assuntos relacionados</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {material.subjects.map((s) => (
                <li
                  key={s}
                  className="rounded-lg bg-indigo-soft px-2.5 py-1 text-xs font-medium text-indigo"
                >
                  {s}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-[hsl(var(--text-secondary))]">
              {material.discipline} • {typeLabel[material.type]} de {material.level.toLowerCase()}
            </p>
          </section>
        </aside>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
