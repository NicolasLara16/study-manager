import * as React from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Show error state (red border + alert icon) */
  error?: boolean;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const input = (
      <div className="relative w-full">
        <input
          ref={ref}
          id={id}
          className={cn(
            "h-10 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          {...props}
        />
        {error && (
          <CircleAlert
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500"
          />
        )}
      </div>
    );

    if (!label) return input;

    return (
      <div className="flex w-full flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-[hsl(var(--text-primary))]">
          {label}
        </label>
        {input}
      </div>
    );
  }
);

Input.displayName = "Input";
