"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

interface ToastProps {
  message: string;
  onDone: () => void;
}

/** Toast de confirmação demonstrativo com auto-dismiss de 4s. */
export function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    const id = setTimeout(onDone, 4000);
    return () => clearTimeout(id);
  }, [message, onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 right-4 z-50 flex max-w-xs items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 shadow-[0_12px_36px_rgba(0,0,0,0.16)] md:bottom-6 md:right-6"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden />
      <p className="text-sm text-[hsl(var(--text-primary))]">{message}</p>
    </div>
  );
}
