/**
 * Refresh de sessão para o middleware (padrão oficial do @supabase/ssr).
 *
 * Fase atual: apENas renova cookies de sessão; NÃO bloqueia nem redireciona
 * rotas — as telas de login chegam na P1b. Se o Supabase não estiver
 * configurado, o middleware é no-op (build/preview sem .env continuam de pé).
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicConfig } from "@/lib/env";

/**
 * Rotas protegidas por sessão — PREENCHER na P1b, quando existirem telas de
 * login (grupo `(app)`:/dashboard, /estudo, /objetivos, /planejamento,
 * /estatisticas, /biblioteca, /edital, /configuracoes). Vazio = sem bloqueio.
 */
export const PROTECTED_ROUTES: readonly string[] = [];

/** Rota de destino de login para P1b (redirecionamento quando aplicável). */
export const LOGIN_PATH = "/login";

/** Renova a sessão a partir dos cookies da request; devolve a resposta atualizada. */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const config = getSupabasePublicConfig();
  if (!config) return NextResponse.next({ request });

  // Preserva `request`/`response` para que o token renovado seja gravado
  // de volta nos cookies da resposta (padrão do @supabase/ssr).
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // 1) Reflete no request para o restante do pipeline da request.
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        // 2) Recria a resposta da request atualizada e escreve os cookies.
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Força a troca do token expirado e grava os cookies novos (refresh de sessão).
  // Nunca usar este resultado para decisão de acesso — isso é papel de auth.ts.
  await supabase.auth.getUser();

  // TODO(P1b): com telas de login prontas, redirecionar à LOGIN_PATH quando
  // usuário anônimo acessar rota de PROTECTED_ROUTES (começando com path === rota).

  return supabaseResponse;
}
