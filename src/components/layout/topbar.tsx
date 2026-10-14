"use client";

import Link from "next/link";
import { Search, Bell, Sun, Moon, GraduationCap } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(var(--text-secondary))] transition-colors hover:bg-subtle hover:text-[hsl(var(--text-primary))]",
        className
      )}
      aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

export function Topbar() {
  const pathname = usePathname();

  return (
    <header className="hidden h-[4.5rem] shrink-0 items-center justify-between gap-6 border-b border-line bg-surface px-6 xl:flex">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm">
          <li className="text-[hsl(var(--text-secondary))]">Workspace</li>
          <li aria-hidden className="text-[hsl(var(--text-muted))]">/</li>
          <li aria-current="page" className="font-medium text-[hsl(var(--text-primary))]">
            {crumb(pathname)}
          </li>
        </ol>
      </nav>

      <div className="flex items-center gap-2">
        {/* Busca global */}
        <button
          type="button"
          className="flex h-9 w-64 items-center gap-2 rounded-lg border border-line bg-app px-3 text-sm text-[hsl(var(--text-muted))] transition-colors hover:bg-subtle"
          aria-label="Buscar (Control+K ou Command+K)"
        >
          <Search className="h-4 w-4" aria-hidden />
          <span className="flex-1 text-left">Buscar...</span>
          <kbd className="h-5 w-5 rounded bg-surface border border-line text-[10px] font-medium leading-5 text-[hsl(var(--text-secondary))]">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(var(--text-secondary))] transition-colors hover:bg-subtle hover:text-[hsl(var(--text-primary))]"
          aria-label="Notificações (3 novas)"
        >
          <Bell className="h-[18px] w-[18px]" aria-hidden />
          <span aria-hidden className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo" />
        </button>

        <ThemeToggle />
      </div>
    </header>
  );
}

/** Header mobile em tablet/mobile (<md) */
export function MobileHeader() {
  const { toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-[3.5rem] shrink-0 items-center justify-between border-b border-line bg-surface px-4 xl:hidden">
      <Link href="/" className="flex items-center gap-2 text-indigo">
        <GraduationCap className="h-5 w-5" aria-hidden />
        <span className="text-sm font-semibold text-[hsl(var(--text-primary))]">Study Manager</span>
      </Link>
      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(var(--text-secondary))] hover:bg-subtle"
        aria-label="Alternar tema"
      >
        <Moon className="h-[18px] w-[18px]" aria-hidden />
      </button>
    </header>
  );
}

function crumb(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  const map: Record<string, string> = {
    "/planejamento": "Meu planejamento",
    "/estudo": "Sessões de estudo",
    "/explorar": "Explorar conteúdos",
    "/biblioteca": "Meus materiais",
    "/edital": "Edital",
    "/estatisticas": "Estatísticas",
    "/objetivos": "Objetivos",
    "/configuracoes": "Configurações",
  };
  return map[pathname] ?? pathname.replace("/", "").replace(/^\w/, (c) => c.toUpperCase());
}
