import * as React from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  /** Change/context indicator, e.g. "+12%" or "esta semana" */
  hint?: string;
  hintPositive?: boolean;
  icon?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  hint,
  hintPositive,
  icon,
  className,
  ...props
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[hsl(var(--text-secondary))]">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-[hsl(var(--text-primary))]">
            {value}
          </p>
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-soft text-indigo">
            {icon}
          </div>
        )}
      </div>
      {hint && (
        <p
          className={cn(
            "mt-2 text-xs font-medium",
            hintPositive ? "text-success" : "text-[hsl(var(--text-secondary))]"
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
