/**
 * Validação de variáveis de ambiente via Zod.
 *
 * Regras de segurança (docs/op-seg-fase2-analise-auth-autorizacao-validacao.md §6):
 * - Nenhum valor de segredo é incluído em mensagens de erro — apenas os NOMES
 *   das variáveis com problema.
 * - Leitura preguiçosa: nada lança no import, para o build passar sem `.env`
 *   (ex.: CI, preview de protótipo). Quem usar chama o getter e trata o caso.
 * - `NEXT_PUBLIC_*` é público por definição: nunca colocar segredo nesses nomes.
 */

import { z } from "zod";

/** Variáveis SUPABASE públicas (browser + server). */
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

/** Variáveis de servidor — nunca devem receber prefixo NEXT_PUBLIC_. */
export const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  /** Conexão direta (sem pool) usada apenas em migrations. */
  DIRECT_URL: z.string().min(1).optional(),
  /** Chave admin: BYPASSA RLS. Somente em módulos server-only (purge admin). */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Formata os issues do Zod apontando apenas NOMES de variáveis. */
function formatIssues(error: z.ZodError<unknown>): string {
  const problems = error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `variável "${path}" inválida` : issue.message;
  });
  return `Variáveis de ambiente inválidas (${problems.join("; ")}).`;
}

let cachedPublic: SupabasePublicConfig | null = null;
let cachedPublicLookup = false;

/**
 * Configuração pública do Supabase, ou `null` quando ausente/inválida.
 * Cacheado por import (os testes fazem `vi.resetModules()` para recarregar).
 */
export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  // Cache do "não configurado": o resultado é estável por módulo
  // (os testes fazem `vi.resetModules()` para recarregar).
  if (!cachedPublicLookup) {
    cachedPublicLookup = true;
    const parsed = publicEnvSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
    cachedPublic = parsed.success
      ? {
          url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
          anonKey: parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        }
      : null;
  }
  return cachedPublic;
}

/** `true` quando há configuração pública do Supabase (URL + anon key válidos). */
export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig() !== null;
}

/**
 * Variáveis de servidor do Prisma. Lança erro claro (sem valores) quando
 * DATABASE_URL está ausente ou inválida — só chame em rotas de servidor.
 */
export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  if (!parsed.success) {
    throw new Error(formatIssues(parsed.error));
  }
  return parsed.data;
}
