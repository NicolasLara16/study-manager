import type { Metadata } from "next";
import { EditalView } from "@/components/editor/edital-view";

export const metadata: Metadata = { title: "Analisador de edital" };

export default function EditalPage() {
  return <EditalView />;
}
