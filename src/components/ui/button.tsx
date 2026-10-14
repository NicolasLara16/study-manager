import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  /** Left icon (Lucide component) */
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-app",
          "disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" &&
            "h-11 rounded-lg bg-indigo px-4 text-sm text-white hover:bg-indigo/90",
          variant === "secondary" &&
            "h-10 rounded-lg border border-line bg-surface px-4 text-sm text-[hsl(var(--text-primary))] hover:bg-subtle",
          className
        )}
        {...props}
      >
        {icon}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
