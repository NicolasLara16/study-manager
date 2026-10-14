import type { Metadata } from "next";
import { StudyWorkbench } from "@/components/study/study-workbench";

export const metadata: Metadata = { title: "Sessão de estudo" };

export default function StudySessionsPage() {
  return <StudyWorkbench />;
}
