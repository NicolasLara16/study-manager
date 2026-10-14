/**
 * Validação de variáveis de ambiente via Zod.
 *
 * Regras de segurança (docs/op-seg-fase2-analise-auth-autorizacao-validacao.md §6):
 * - Nenhum valor de segredo é incluído em mensagens de erro — apenas os NOMES
 *   das variáveis com problema.
 * - Leitura preguiçosa: nada lança no import, para o build passar sem `.env`
 *   (ex.: CI, preview de protótipo). Quem usar chama o getter e trata o caso.
 * - `NEXT_PUBLIC_*` é público por definição: nunca colocar segredo nesses nomes.
 *
 * Chaves públicas do Supabase:
 * - PREFERIDA: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (novo padrão do Supabase).
 * - FALLBACK LEGADO: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (aceita, mas deprecada).
 * - Chave que pareça SECRETA (`sb_secret_...` ou JWT com role service_role)
 *   é REJEITADA com erro claro: colar segredo em var NEXT_PUBLIC_ expõe o
 *   valor no bundle do browser.
 */

import { z } from "zod";

/** Variáveis SUPABASE públicas (browser + server). Ambas as chaves são opcionais: a escolha é resolvida em runtime (publishable > anon). */
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
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
  /** Chave pública em uso (publishable preferida; anon como fallback legado). */
  key: string;
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

/**
 * Detecta chave SECRETA colada em variável pública:
 * - prefixo "sb_secret_" (novo formato de chave secreta do Supabase);
 * - JWT cujo payload declara role "service_role" (formato legado).
 */
export function looksLikeSecretKey(value: string): boolean {
  if (value.startsWith("sb_secret_")) return true;

  const parts = value.split(".");
  if (parts.length !== 3) return false; // Só inspeção de JWT é necessária.

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decode = (s: string) =>
      typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("utf8");
    const payload = JSON.parse(decode(padded)) as { role?: unknown };
    return payload?.role === "service_role";
  } catch {
    return false;
  }
}

type PublicCache =
  | { status: "ok"; config: SupabasePublicConfig }
  | { status: "none" }
  | { status: "error"; error: Error };

function evaluatePublicEnv(): PublicCache {
  const keyEnv =
    publicEnvSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
  if (!keyEnv.success) return { status: "none" };

  const url = keyEnv.data.NEXT_PUBLIC_SUPABASE_URL;
  // Preferência explícita: publishable (novo padrão) > anon (legado).
  const publishable = keyEnv.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anon = keyEnv.data.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = publishable ?? anon;
  if (!key) return { status: "none" };
  const keyEnvName = publishable
    ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    : "NEXT_PUBLIC_SUPABASE_ANON_KEY";

  if (looksLikeSecretKey(key)) {
    // Falha LOUD e explicativa: é uma configuração errada, não apenas ausente.
    return {
      status: "error",
      error: new Error(
        `${keyEnvName} contém o que parece ser uma chave SECRETA (prefixo "sb_secret_" ou JWT com role "service_role"). ` +
          "Nunca coloque segredo em variável NEXT_PUBLIC_: o valor é exposto no bundle do browser. " +
          "Use a chave publishable (preferida) ou anon do projeto Supabase; a chave secreta pertence somente ao servidor."
      ),
    };
  }

  return { status: "ok", config: { url, key } };
}

let cachedPublic: PublicCache | undefined;

/**
 * Configuração pública do Supabase ({ url, key }), ou `null` quando ausente.
 * Lança erro claro se uma chave SECRETA foi colada em variável pública.
 * Cacheado por import (os testes fazem `vi.resetModules()` para recarregar).
 */
export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  cachedPublic ??= evaluatePublicEnv();
  if (cachedPublic.status === "error") throw cachedPublic.error;
  return cachedPublic.status === "ok" ? cachedPublic.config : null;
}

/** `true` quando há configuração pública do Supabase (URL + chave pública válidos). */
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
