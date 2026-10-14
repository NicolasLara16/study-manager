import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { MaterialDetailView } from "@/components/explorer/material-detail-view";
import { materialsData } from "@/lib/mock-data";

interface PageProps {
  params: { id: string };
}

export function generateStaticParams() {
  return materialsData.map((m) => ({ id: m.id }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const material = materialsData.find((m) => m.id === params.id);
  return { title: material?.title ?? "Material não encontrado" };
}

export default function MaterialDetailsPage({ params }: PageProps) {
  const material = materialsData.find((m) => m.id === params.id);

  if (!material) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface p-12 text-center">
        <Compass className="h-6 w-6 text-[hsl(var(--text-muted))]" aria-hidden />
        <p className="text-sm font-medium text-[hsl(var(--text-primary))]">
          Material não encontrado
        </p>
        <p className="max-w-sm text-xs text-[hsl(var(--text-secondary))]">
          O conteúdo que você tentou abrir não está no catálogo demonstrativo. Explore o catálogo a
          partir da lista principal.
        </p>
        <Link
          href="/explorar"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo px-4 text-sm font-medium text-white hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-app"
        >
          Voltar aos resultados
        </Link>
      </div>
    );
  }

  return <MaterialDetailView material={material} />;
}
