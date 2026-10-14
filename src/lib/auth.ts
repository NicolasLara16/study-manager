/** Fonte da verdade do usuário autenticado. Importado apenas do servidor. */

import "server-only";

import { AppError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Representação mínima e blindada do usuário da sessão. */
export type SessionUser = {
  id: string;
  email: string;
};

/**
 * Usuário da sessão, verificado no servidor do Supabase (`getUser()`, que
 * valida o JWT com o servidor de auth). NUNCA usar `getSession()` do cliente.
 * Retorna `null` sem sessão, erro de verificação ou Supabase não configurado.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null; // Supabase não configurado (build/preview).

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? "",
  };
}

/**
 * MANDATÓRIO em toda Server Action e página protegida.
 * Lança `AppError(UNAUTHENTICATED)` quando não há usuário válido —
 * `toActionError` converte em mensagem segura para o cliente.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AppError("UNAUTHENTICATED");
  return user;
}
