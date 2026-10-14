import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/** Renova a sessão (cookies httpOnly) antes de qualquer renderização. */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/** Exclui assets estáticos, imagens e favicon do processamento do middleware. */
export const config = {
  matcher: [
    /*
     * Roda em tudo, exceto:
     * - `_next/static` (assets embutidos) e `_next/image` (otimizador de imagem);
     * - favicon.ico (arquivo de raiz);
     * - imagens estáticas (png/jpg/jpeg/svg/gif/webp/ico/txt/xml).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|txt|xml)$).*)",
  ],
};
