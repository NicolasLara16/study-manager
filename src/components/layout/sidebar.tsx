"use client";

import Link from "next/link";
import { GraduationCap, Settings } from "lucide-react";
import { mainNav } from "@/lib/nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";

interface SidebarProps {
  /** "full" = desktop (≥lg), "compact" = tablet (md–lg, ícones apenas) */
  variant: "full" | "compact";
}

export function Sidebar({ variant }: SidebarProps) {
  const compact = variant === "compact";

  return (
    <aside
      aria-label="Navegação principal"
      className={cn(
        "flex h-full flex-col border-r border-line bg-surface transition-[width]",
        compact ? "w-[4rem]" : "w-[15.5rem]"
      )}
    >
      {/* Logo */}
      <div className={cn("flex h-[4.5rem] items-center border-b border-line", compact ? "justify-center px-2" : "px-4")}>
        <Link href="/" className="flex items-center gap-2 text-indigo" aria-label="Study Manager — página inicial">
          <GraduationCap className="h-6 w-6 shrink-0" />
          {!compact && (
            <span className="text-sm font-semibold text-[hsl(var(--text-primary))]">
              Study Manager
            </span>
          )}
        </Link>
      </div>

      {/* Navegação principal */}
      <SidebarNav items={mainNav} compact={compact} />

      {/* Meta semanal (apenas desktop) */}
      {!compact && (
        <div className="mx-3 mb-3 rounded-xl bg-subtle p-3">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium text-[hsl(var(--text-secondary))]">
              Meta semanal
            </p>
            <p className="text-sm font-semibold text-[hsl(var(--text-primary))]">82%</p>
          </div>
          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--border))]"
            role="progressbar"
            aria-valuenow={82}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso da meta semanal: 82%"
          >
            <div className="h-full w-[82%] rounded-full bg-indigo" />
          </div>
          <p className="mt-2 text-[11px] leading-snug text-[hsl(var(--text-secondary))]">
            Faltam 1h 48min para concluir
          </p>
        </div>
      )}

      {/* Rodapé: Configurações + Perfil */}
      <div className="mt-auto border-t border-line p-3">
        <SidebarNav
          items={[{ label: "Configurações", href: "/configuracoes", icon: Settings }]}
          compact={compact}
        />
        {!compact && (
          <div className="mt-2 flex items-center gap-2.5 rounded-lg p-2 hover:bg-subtle">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-soft text-xs font-semibold text-indigo">
              MC
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[hsl(var(--text-primary))]">
                Marina Costa
              </p>
              <p className="truncate text-xs text-[hsl(var(--text-secondary))]">
                Plano pessoal
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
