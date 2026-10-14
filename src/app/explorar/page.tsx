import type { Metadata } from "next";
import { ExplorerView } from "@/components/explorer/explorer-view";

export const metadata: Metadata = { title: "Explorar conteúdos" };

export default function ExplorePage() {
  return <ExplorerView />;
}
