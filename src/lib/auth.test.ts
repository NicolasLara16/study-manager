import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/auth";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { AppError, toActionError } from "@/lib/errors";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

const mockedCreate = vi.mocked(createSupabaseServerClient);

type GetUserResult = Awaited<ReturnType<SupabaseClient["auth"]["getUser"]>>;

function clientWithGetUser(result: GetUserResult): SupabaseClient {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue(result),
    },
  } as unknown as SupabaseClient;
}

describe("auth", () => {
  beforeEach(() => {
    mockedCreate.mockReset();
  });

  describe("getCurrentUser", () => {
    it("retorna null quando o Supabase não está configurado (sem .env)", async () => {
      mockedCreate.mockReturnValue(null);
      expect(await getCurrentUser()).toBeNull();
    });

    it("retorna { id, email } quando getUser() valida a sessão", async () => {
      mockedCreate.mockReturnValue(
        clientWithGetUser({
          data: { user: { id: "user-1", email: "user@example.com" } },
          error: null,
        } as GetUserResult)
      );

      const user = await getCurrentUser();
      expect(user).toEqual({ id: "user-1", email: "user@example.com" });
    });

    it("retorna null quando getUser() reporta erro (JWT inválido/expirado)", async () => {
      mockedCreate.mockReturnValue(
        clientWithGetUser({
          data: { user: null },
          error: { message: "invalid claim: missing sub claim", status: 401 },
        } as unknown as GetUserResult)
      );

      expect(await getCurrentUser()).toBeNull();
    });

    it("retorna null quando não há usuário", async () => {
      mockedCreate.mockReturnValue(
        clientWithGetUser({
          data: { user: null },
          error: null,
        } as unknown as GetUserResult)
      );

      expect(await getCurrentUser()).toBeNull();
    });

    it("normaliza e-mail ausente para string vazia (nunca null)", async () => {
      mockedCreate.mockReturnValue(
        clientWithGetUser({
          data: { user: { id: "user-2", email: null } },
          error: null,
        } as unknown as GetUserResult)
      );

      const user: SessionUser | null = await getCurrentUser();
      expect(user).toEqual({ id: "user-2", email: "" });
    });
  });

  describe("requireUser", () => {
    it("lança AppError UNAUTHENTICATED sem sessão", async () => {
      mockedCreate.mockReturnValue(null);

      await expect(requireUser()).rejects.toMatchObject({
        name: "AppError",
        code: "UNAUTHENTICATED",
        message: "Sessão expirada. Entre novamente.",
      });
    });

    it("erros viram ActionResult seguro via toActionError", async () => {
      mockedCreate.mockReturnValue(null);

      const error = await requireUser().catch((e) => e);
      expect(toActionError(error)).toEqual({
        ok: false,
        code: "UNAUTHENTICATED",
        message: "Sessão expirada. Entre novamente.",
      });
    });

    it("retorna o usuário da sessão — fonte única de userId", async () => {
      mockedCreate.mockReturnValue(
        clientWithGetUser({
          data: { user: { id: "user-3", email: "me@example.com" } },
          error: null,
        } as GetUserResult)
      );

      const user = await requireUser();
      expect(user.id).toBe("user-3");
      expect(user.email).toBe("me@example.com");
    });

    it("falha com instância de AppError (compatibilidade instanceof)", async () => {
      mockedCreate.mockReturnValue(null);

      const error = await requireUser().catch((e) => e);
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("UNAUTHENTICATED");
    });
  });
});
