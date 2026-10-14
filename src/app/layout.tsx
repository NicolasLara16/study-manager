import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SavedMaterialsProvider } from "@/components/library/saved-context";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: {
    default: "Study Manager",
    template: "%s • Study Manager",
  },
  description:
    "Organize estudos, sessões, materiais e objetivos com o Study Manager.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SavedMaterialsProvider>
            <AppShell>{children}</AppShell>
          </SavedMaterialsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
