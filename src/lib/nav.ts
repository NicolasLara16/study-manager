import {
  Target,
  LayoutDashboard,
  CalendarRange,
  Timer,
  Compass,
  Library,
  FileText,
  ChartNoAxesCombined,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const mainNav: NavItem[] = [
  { label: "Visão geral", href: "/", icon: LayoutDashboard },
  { label: "Meu planejamento", href: "/planejamento", icon: CalendarRange },
  { label: "Sessões de estudo", href: "/estudo", icon: Timer },
  { label: "Explorar conteúdos", href: "/explorar", icon: Compass },
  { label: "Meus materiais", href: "/biblioteca", icon: Library },
  { label: "Edital", href: "/edital", icon: FileText },
  { label: "Estatísticas", href: "/estatisticas", icon: ChartNoAxesCombined },
  { label: "Objetivos", href: "/objetivos", icon: Target },
];

export const bottomNavMobile = [
  { label: "Início", href: "/" },
  { label: "Plano", href: "/planejamento" },
  { label: "Estudar", href: "/estudo" },
  { label: "Explorar", href: "/explorar" },
];
