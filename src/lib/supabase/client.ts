/** Cliente Supabase para uso exclusivo no browser (efeitos client-side NÃO autoritativos). */

"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicConfig } from "@/lib/env";

/**
 * Novo cliente por chamada no client (o `@supabase/ssr` reutiliza o singleton
 * interno com a mesma url/key). Retorna `null` quando não configurado.
 *
 * Nunca usar este cliente como fonte de autorização — dados sensíveis só
 * vêm do servidor (`auth.ts`).
 */
export function createSupabaseBrowserClient(): SupabaseClient | null {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  return createBrowserClient(config.url, config.key);
}
