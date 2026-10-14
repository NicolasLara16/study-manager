/** Clientes Supabase SSR para uso no servidor (Server Components, Actions, Routes). */

import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicConfig } from "@/lib/env";

/**
 * Cria um cliente Supabase por requisição, com cookies do `next/headers`.
 * Retorna `null` quando o Supabase não está configurado (build/preview sem .env).
 *
 * Regras: decisão de acesso SEMPRE com `getUser()` no servidor (ver auth.ts),
 * nunca com `getSession()` do lado do cliente.
 */
export function createSupabaseServerClient(): SupabaseClient | null {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const cookieStore = cookies();

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Chamado de um Server Component (`cookies()` é imutável nesses casos).
          // O middleware lidou (ou lidará) com o refresh da sessão — seguro ignorar.
        }
      },
    },
  });
}
