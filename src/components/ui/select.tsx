import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  /** Ícone (Lucide) exibido junto ao rótulo */
  icon?: React.ReactNode;
}

export function Select({ label, id, icon, className, children, ...props }: SelectProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--text-primary))]"
      >
        {icon}
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className={cn(
            "h-10 w-full appearance-none rounded-lg border border-line bg-surface px-3 pr-9 text-sm text-[hsl(var(--text-primary))]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--text-muted))]"
        />
      </div>
    </div>
  );
}
