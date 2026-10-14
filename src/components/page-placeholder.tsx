import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PagePlaceholderProps {
  title: string;
  children?: ReactNode;
  className?: string;
}

export function PagePlaceholder({ title, children, className }: PagePlaceholderProps) {
  return (
    <section className={cn("space-y-6", className)} aria-labelledby={`ph-${title}`}>
      <h1
        id={`ph-${title}`}
        className="text-2xl font-semibold tracking-tight text-[hsl(var(--text-primary))]"
      >
        {title}
      </h1>
      <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-sm text-[hsl(var(--text-secondary))]">
        {children ?? (
          <p>Tela em contrução — será implementada em uma das próximas etapas.</p>
        )}
      </div>
    </section>
  );
}
