import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar, MobileHeader } from "@/components/layout/topbar";
import { BottomNavigation } from "@/components/layout/bottom-navigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-app">
      <div className="sticky top-0 h-dvh hidden md:block xl:hidden">
        <Sidebar variant="compact" />
      </div>
      {/* Sidebar completa (desktop ≥1280: xl) */}
      <div className="sticky top-0 hidden h-dvh xl:block">
        <Sidebar variant="full" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <MobileHeader />
        <main className="min-w-0 flex-1 px-4 py-5 md:px-6 md:py-6 xl:px-6 xl:py-8 max-w-7xl w-full md:mx-auto xl:mx-0 pb-[5rem] md:pb-8">
          {children}
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
