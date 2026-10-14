"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
}

/** Modal de confirmação acessível: aria-modal, Escape para fechar, foco inicial no botão primário e devolução do foco. */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = `dialog-title-${title.replace(/\s+/g, "-").toLowerCase()}`;

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const firstButton = panelRef.current?.querySelector<HTMLButtonElement>("button, [href], textarea, select");

    firstButton?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-[0_16px_48px_rgba(0,0,0,0.24)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[hsl(var(--text-muted))] hover:bg-subtle hover:text-[hsl(var(--text-primary))]"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <h2 id={titleId} className="pr-8 text-base font-semibold text-[hsl(var(--text-primary))]">
          {title}
        </h2>
        <div className="mt-2 text-sm leading-relaxed text-[hsl(var(--text-secondary))]">{children}</div>
      </div>
    </div>
  );
}
