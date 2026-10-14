import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "ready" | "in_progress" | "done" | "neutral";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  label: string;
}

const dotColor: Record<BadgeTone, string> = {
  ready: "bg-indigo",
  in_progress: "bg-amber-500",
  done: "bg-success",
  neutral: "bg-[hsl(var(--text-muted))]",
};

const toneStyle: Record<BadgeTone, string> = {
  ready: "bg-indigo-soft text-indigo",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  done: "bg-success/10 text-success",
  neutral: "bg-subtle text-[hsl(var(--text-secondary))]",
};

export function Badge({ tone = "neutral", label, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium",
        toneStyle[tone],
        className
      )}
      {...props}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", dotColor[tone])} />
      {label}
    </span>
  );
}
