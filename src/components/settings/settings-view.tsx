"use client";

import { useState, useTransition } from "react";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme, type ThemeChoice } from "@/components/theme-provider";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const POMODORO_KEY = "study-manager-pomodoro";

const themeOptions: Array<{ key: ThemeChoice; label: string; icon: React.ReactNode }> = [
  { key: "light", label: "Claro", icon: <Sun className="h-4 w-4" aria-hidden /> },
  { key: "dark", label: "Escuro", icon: <Moon className="h-4 w-4" aria-hidden /> },
  { key: "system", label: "Sistema", icon: <Monitor className="h-4 w-4" aria-hidden /> },
];

const preferenceToggles = [
  {
    key: "notificacoes-sessao",
    label: "Notificações de sessão",
    desc: "Avisar quando uma sessão planejada estiver próxima",
  },
  {
    key: "sons-cronometro",
    label: "Sons do cronômetro",
    desc: "Tocar um som discreto a cada fase concluída do Pomodoro",
  },
];

function readPomodoro() {
  if (typeof window === "undefined") return { focus: 25, short: 5, long: 15 };
  try {
    const raw = window.localStorage.getItem(POMODORO_KEY);
    if (raw) return JSON.parse(raw) as { focus: number; short: number; long: number };
  } catch {
    /* localStorage indisponível */
  }
  return { focus: 25, short: 5, long: 15 };
}

export function SettingsView() {
  const { choice, setChoice } = useTheme();
  const [name, setName] = useState("Marina Costa");
  const [email, setEmail] = useState("marina.costa@email.com");
  const [meta, setMeta] = useState({ weeklyHours: 10, ...readPomodoro() });
  const [toggles, setToggles] = useState({
    "notificacoes-sessao": true,
    "sons-cronometro": true,
  } as Record<string, boolean>);
  const [toast, setToast] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function showToast(msg: string) {
    setToast(null);
    requestAnimationFrame(() => setToast(msg));
  }

  function handleSaveAll(e: React.FormEvent) {
    e.preventDefault();
    try {
      window.localStorage.setItem(POMODORO_KEY, JSON.stringify({
        focus: meta.focus,
        short: meta.short,
        long: meta.long,
      }));
    } catch {
      /* localStorage indisponível — segue em memória */
    }
    startTransition(() => {
      showToast("Alterações salvas com sucesso.");
    });
  }

  return (
    <form onSubmit={handleSaveAll} className="mx-auto max-w-3xl space-y-6">
      {/* Cabeçalho + ação global */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--text-primary))]">
            Configurações
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--text-secondary))]">
            Ajuste perfil, metas e interface — salvo apenas neste dispositivo.
          </p>
        </div>
        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo px-5 text-sm font-medium text-white hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-app"
        >
          <Check className="h-4 w-4" aria-hidden />
          Salvar alterações
        </button>
      </header>

      {/* Perfil do estudante */}
      <section aria-labelledby="titulo-perfil" className="rounded-xl border border-line bg-surface p-5">
        <h2 id="titulo-perfil" className="text-base font-semibold text-[hsl(var(--text-primary))]">
          Perfil do estudante
        </h2>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-soft text-sm font-semibold text-indigo">
            MC
          </span>
          <div>
            <p className="text-sm font-medium text-[hsl(var(--text-primary))]">{name}</p>
            <p className="text-xs text-[hsl(var(--text-secondary))]">Plano pessoal • conta demonstrativa</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-[hsl(var(--text-primary))]">Nome</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-[hsl(var(--text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-[hsl(var(--text-primary))]">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-[hsl(var(--text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
            />
          </label>
        </div>
      </section>

      {/* Metas e hábitos */}
      <section aria-labelledby="titulo-metas" className="rounded-xl border border-line bg-surface p-5">
        <h2 id="titulo-metas" className="text-base font-semibold text-[hsl(var(--text-primary))]">
          Metas e hábitos
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-[hsl(var(--text-primary))]">Meta semanal</span>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={70}
                value={meta.weeklyHours}
                onChange={(e) => setMeta((m) => ({ ...m, weeklyHours: Number(e.target.value) }))}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 pr-8 text-sm text-[hsl(var(--text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[hsl(var(--text-muted))]">
                h
              </span>
            </div>
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-[hsl(var(--text-primary))]">Foco (Pomodoro)</span>
            <div className="relative">
              <input
                type="number"
                min={5}
                max={120}
                value={meta.focus}
                onChange={(e) => setMeta((m) => ({ ...m, focus: Number(e.target.value) }))}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 pr-8 text-sm text-[hsl(var(--text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[hsl(var(--text-muted))]">
                min
              </span>
            </div>
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-[hsl(var(--text-primary))]">Pausa curta</span>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={30}
                value={meta.short}
                onChange={(e) => setMeta((m) => ({ ...m, short: Number(e.target.value) }))}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 pr-8 text-sm text-[hsl(var(--text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[hsl(var(--text-muted))]">
                min
              </span>
            </div>
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-[hsl(var(--text-primary))]">Pausa longa</span>
            <div className="relative">
              <input
                type="number"
                min={5}
                max={60}
                value={meta.long}
                onChange={(e) => setMeta((m) => ({ ...m, long: Number(e.target.value) }))}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 pr-8 text-sm text-[hsl(var(--text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[hsl(var(--text-muted))]">
                min
              </span>
            </div>
          </label>
        </div>
        <p className="mt-3 text-xs text-[hsl(var(--text-secondary))]">
          As durações do Pomodoro valem para a aba &quot;Sessões de estudo&quot; em novas sessões.
        </p>
      </section>

      {/* Preferências e interface */}
      <section aria-labelledby="titulo-prefs" className="rounded-xl border border-line bg-surface p-5">
        <h2 id="titulo-prefs" className="text-base font-semibold text-[hsl(var(--text-primary))]">
          Preferências e interface
        </h2>

        <p className="mt-4 text-sm font-medium text-[hsl(var(--text-primary))]">Tema</p>
        <div role="radiogroup" aria-label="Escolher tema" className="mt-2 grid grid-cols-3 max-w-sm gap-3">
          {themeOptions.map((o) => (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={choice === o.key}
              onClick={() => setChoice(o.key)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo",
                choice === o.key
                  ? "border-indigo bg-indigo-soft/60 text-indigo"
                  : "border-line text-[hsl(var(--text-secondary))] hover:bg-subtle"
              )}
            >
              {o.icon}
              {o.label}
            </button>
          ))}
        </div>

        <ul className="mt-5 divide-y divide-[hsl(var(--border))] border-t border-[hsl(var(--border))] pt-1">
          {preferenceToggles.map((n) => {
            const on = toggles[n.key];
            return (
              <li key={n.key} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--text-primary))]">{n.label}</p>
                  <p className="text-xs text-[hsl(var(--text-secondary))]">{n.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={on ? `Desativar ${n.label}` : `Ativar ${n.label}`}
                  onClick={() => {
                    setToggles((s) => ({ ...s, [n.key]: !on }));
                    showToast(on ? `${n.label} desativado.` : `${n.label} ativado.`);
                  }}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-app",
                    on ? "bg-indigo" : "bg-[hsl(var(--border))]"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                      on ? "left-[1.4rem]" : "left-0.5"
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </form>
  );
}
