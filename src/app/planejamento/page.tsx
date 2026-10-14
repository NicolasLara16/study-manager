import type { Metadata } from "next";
import { PlanningView } from "@/components/planning/planning-view";

export const metadata: Metadata = { title: "Meu planejamento" };

export default function PlanningPage() {
  return <PlanningView />;
}
