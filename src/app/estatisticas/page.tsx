import type { Metadata } from "next";
import { StatisticsView } from "@/components/stats/statistics-view";

export const metadata: Metadata = { title: "Estatísticas" };

export default function StatisticsPage() {
  return <StatisticsView />;
}
