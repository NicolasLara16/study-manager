"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  Timer,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { bottomNavMobile } from "@/lib/nav";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  "/": LayoutDashboard,
  "/planejamento": CalendarRange,
  "/estudo": Timer,
  "/explorar": Compass,
};

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-40 flex h-[4rem] items-stretch border-t border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 md:hidden"
    >
      {bottomNavMobile.map((item) => {
        const active = pathname === item.href;
        const Icon = icons[item.href] ?? Compass;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-t-lg text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo",
              active ? "text-indigo" : "text-[hsl(var(--text-secondary))]"
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
