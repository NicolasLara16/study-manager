import type { Metadata } from "next";
import { LibraryView } from "@/components/library/library-view";

export const metadata: Metadata = { title: "Meus materiais" };

export default function LibraryPage() {
  return <LibraryView />;
}
