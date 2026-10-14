"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";

export function SidebarNav({ items, compact }: { items: NavItem[]; compact: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto p-3">
      <ul className={compact ? "flex flex-col items-center gap-1" : "flex flex-col gap-1"}>
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <li key={item.href} className={compact ? "w-full" : ""}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo",
                  compact && "justify-center px-0",
                  active
                    ? "bg-indigo-soft text-indigo"
                    : "text-[hsl(var(--text-secondary))] hover:bg-subtle hover:text-[hsl(var(--text-primary))]"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                {!compact && <span className="truncate">{item.label}</span>}
                {compact && <span className="sr-only">{item.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
