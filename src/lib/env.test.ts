import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `env.ts` lê `process.env` de forma preguiçosa e cacheia no próprio módulo.
 * Para cada cenário: zera módulos e stubs e reimporta dinamicamente.
 */

type EnvModule = typeof import("@/lib/env");

async function importEnv(): Promise<EnvModule> {
  vi.resetModules();
  return await import("@/lib/env");
}

describe("env", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("configuração pública do Supabase", () => {
    it("retorna null e isSupabaseConfigured=false quando as variáveis estão ausentes", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);

      const env = await importEnv();
      expect(env.getSupabasePublicConfig()).toBeNull();
      expect(env.isSupabaseConfigured()).toBe(false);
    });

    it("retorna null quando a URL pública é inválida (não é uma URL)", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "não-é-uma-url");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

      const env = await importEnv();
      expect(env.getSupabasePublicConfig()).toBeNull();
      expect(env.isSupabaseConfigured()).toBe(false);
    });

    it("retorna null quando a anon key está vazia", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://projeto.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

      const env = await importEnv();
      expect(env.getSupabasePublicConfig()).toBeNull();
    });

    it("retorna a configuração quando as variáveis públicas são válidas", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://projeto.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

      const env = await importEnv();
      expect(env.getSupabasePublicConfig()).toEqual({
        url: "https://projeto.supabase.co",
        anonKey: "anon-key",
      });
      expect(env.isSupabaseConfigured()).toBe(true);
    });

    it("o resultado fica cacheado por módulo (segunda leitura não reprocessa)", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://projeto.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

      const env = await importEnv();
      const first = env.getSupabasePublicConfig();
      expect(env.getSupabasePublicConfig()).toBe(first);
    });
  });

  describe("variáveis de servidor", () => {
    it("lança erro claro (sem valores de segredo) quando DATABASE_URL está ausente", async () => {
      vi.stubEnv("DATABASE_URL", undefined);

      const env = await importEnv();
      expect(() => env.getServerEnv()).toThrow(/DATABASE_URL/);
      // A mensagem NUNCA deve conter segredos — só nomes de variáveis.
      expect(() => env.getServerEnv()).not.toThrow(/supabase\.co/);
    });

    it("retorna DATABASE_URL e service role opcional quando válidos", async () => {
      vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db");
      vi.stubEnv("DIRECT_URL", undefined);
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);

      const env = await importEnv();
      const serverEnv = env.getServerEnv();
      expect(serverEnv.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/db");
      expect(serverEnv.SUPABASE_SERVICE_ROLE_KEY).toBe("service-role");
      expect(serverEnv.DIRECT_URL).toBeUndefined();
    });

    it("aceita todas as variáveis de servidor preenchidas", async () => {
      vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db");
      vi.stubEnv("DIRECT_URL", "postgresql://user:pass@localhost:5432/db");
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");

      const env = await importEnv();
      expect(env.getServerEnv().DIRECT_URL).toBe("postgresql://user:pass@localhost:5432/db");
    });
  });
});
