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

const URL_OK = "https://projeto.supabase.co";

describe("env", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("configuração pública do Supabase — seleção de chave", () => {
    it("preferência: PUBLISHABLE_KEY é usada quando ambas (publishable e anon) existem", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_OK);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-legacy");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc");

      const env = await importEnv();
      expect(env.getSupabasePublicConfig()).toEqual({ url: URL_OK, key: "sb_publishable_abc" });
      expect(env.isSupabaseConfigured()).toBe(true);
    });

    it("fallback legado: usa ANON_KEY quando só ela está definida", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_OK);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-legacy");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);

      const env = await importEnv();
      expect(env.getSupabasePublicConfig()).toEqual({ url: URL_OK, key: "anon-legacy" });
    });

    it("usa PUBLISHABLE_KEY quando só ela está definida (anon ausente)", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_OK);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc");

      const env = await importEnv();
      expect(env.getSupabasePublicConfig()).toEqual({
        url: URL_OK,
        key: "sb_publishable_abc",
      });
    });
  });

  describe("configuração pública do Supabase — ausência e invalidade", () => {
    it("retorna null e isSupabaseConfigured=false quando não há URL nem chave", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);

      const env = await importEnv();
      expect(env.getSupabasePublicConfig()).toBeNull();
      expect(env.isSupabaseConfigured()).toBe(false);
    });

    it("retorna null quando a URL pública é inválida", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "não-é-uma-url");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);

      const env = await importEnv();
      expect(env.getSupabasePublicConfig()).toBeNull();
      expect(env.isSupabaseConfigured()).toBe(false);
    });

    it("retorna null quando há URL mas nenhuma chave pública definida", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_OK);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);

      const env = await importEnv();
      expect(env.getSupabasePublicConfig()).toBeNull();
    });
  });

  describe("proteção contra segredo em variável pública", () => {
    it("REJEITA com erro claro PUBLISHABLE_KEY com prefixo sb_secret_", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_OK);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_supersecret");

      const env = await importEnv();
      expect(() => env.getSupabasePublicConfig()).toThrow(
        /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.*SECRETA/
      );
    });

    it("REJEITA com erro claro ANON_KEY (fallback) com prefixo sb_secret_", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_OK);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "sb_secret_supersecret");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);

      const env = await importEnv();
      expect(() => env.getSupabasePublicConfig()).toThrow(
        /NEXT_PUBLIC_SUPABASE_ANON_KEY.*SECRETA/
      );
    });

    it("REJEITA JWT com role service_role em variável pública", async () => {
      // payload base64url({"role":"service_role"}) — payload de service_role legada.
      const payload = Buffer.from(JSON.stringify({ role: "service_role" })).toString(
        "base64url"
      );
      const fakeJwt = `eyJhbGciOiJub25lIn0.${payload}.sig`; // 3 segmentos de JWT
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_OK);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", fakeJwt);

      const env = await importEnv();
      expect(() => env.getSupabasePublicConfig()).toThrow(/SECRETA/);
    });

    it("aceita JWT legítimo com role anon (não é segredo)", async () => {
      const payload = Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_OK);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", `eyJhbGciOi.AI.${payload}`);

      const env = await importEnv();
      expect(env.isSupabaseConfigured()).toBe(true);
    });
  });

  describe("cache e estabilidade", () => {
    it("resultado fica cacheado por módulo (segunda chamada devolve a mesma config)", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_OK);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc");

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
    });

    it("retorna DATABASE_URL e service role opcional quando válidos", async () => {
      vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db");
      vi.stubEnv("DIRECT_URL", undefined);
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");

      const env = await importEnv();
      const serverEnv = env.getServerEnv();
      expect(serverEnv.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/db");
      expect(serverEnv.SUPABASE_SERVICE_ROLE_KEY).toBe("service-role");
      expect(serverEnv.DIRECT_URL).toBeUndefined();
    });
  });
});
