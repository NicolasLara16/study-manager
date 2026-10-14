/** Testes de INTEGRAÇÃO do repository de identity — isolamento cross-user.
 *  Executam APENAS com banco (describe.skipIf(!process.env.DATABASE_URL));
 *  sem DATABASE_URL neste ambiente, a suíte é pulada sem falhar.
 *
 *  Objetivo (risco R1 do relatório): usuário A não lê, não cria e não altera
 *  dados do usuário B; nenhuma query caminha sem userId. */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

type Repository = typeof import("@/modules/identity/repository");
type DbModule = typeof import("@/lib/db");

let repo: Repository;
let db: DbModule["db"];

describe.skipIf(!process.env.DATABASE_URL)(
  "identity repository — isolamento entre usuários (integração)",
  () => {
    let userA: string;
    let userB: string;

    beforeAll(async () => {
      repo = await import("@/modules/identity/repository");
      const dbModule = await import("@/lib/db");
      db = dbModule.db;
    });

    // profiles.id tem FK para auth.users: cada teste cria identidades transitórias
    // (e-mail @example.invalid) e as remove no afterEach — a cascata limpa o resto.
    // O trigger on_auth_user_created já cria o perfil; ele é removido para que cada
    // teste parta sem perfil e exercite o repository.
    beforeEach(async () => {
      userA = randomUUID();
      userB = randomUUID();
      for (const id of [userA, userB]) {
        await db.$executeRaw`
          INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role)
          VALUES (${id}::uuid, ${`it-${id}@example.invalid`}, '{}'::jsonb, 'authenticated', 'authenticated')`;
      }
      await db.profile.deleteMany({ where: { id: { in: [userA, userB] } } });
    });

    afterEach(async () => {
      await db.$executeRaw`DELETE FROM auth.users WHERE id IN (${userA}::uuid, ${userB}::uuid)`;
    });

    it("getProfile não cruza dados: perfil de A é invisível para consulta de B", async () => {
      await repo.ensureProfile(userA, "Usuário A");

      expect(await repo.getProfile(userA)).toMatchObject({ name: "Usuário A" });
      expect(await repo.getProfile(userB)).toBeNull();
    });

    it("ensureProfile é idempotente e não sobrescreve o nome do perfil existente", async () => {
      await repo.ensureProfile(userA, "Nome Original");
      await repo.ensureProfile(userA, "Outro Nome");

      expect(await repo.getProfile(userA)).toMatchObject({ name: "Nome Original" });
    });

    it("settings de B não existem ou ficam independentes dos settings de A (patch isolado)", async () => {
      await repo.ensureProfile(userA, "Usuário A");
      await repo.ensureProfile(userB, "Usuário B");

      // A salva a própria meta; não cria nem altera linha de B
      await repo.updateSettings(userA, { weeklyTargetMinutes: 720, theme: "dark" });

      expect((await repo.getSettings(userB))?.weeklyTargetMinutes).toBeUndefined();
      expect((await repo.getSettings(userA))?.weeklyTargetMinutes).toBe(720);
      expect((await repo.getSettings(userA))?.theme).toBe("dark");

      // B cria os seus com defaults, sem herdar o patch de A
      const settingsB = await repo.ensureSettings(userB);
      expect(settingsB.weeklyTargetMinutes).toBe(600);
      expect(settingsB.timezone).toBe("America/Sao_Paulo");
    });

    it("userId malformado devolve null (não estoura erro de cast no banco)", async () => {
      expect(await repo.getProfile("token-forjado")).toBeNull();
      expect(await repo.getSettings("token-forjado")).toBeNull();
    });

    it("userId malformado em escrita lança erro controlado (sem tocar o banco)", async () => {
      await expect(repo.ensureProfile("token-forjado", "X")).rejects.toThrow(/uuid válido/);
      await expect(repo.ensureSettings("token-forjado")).rejects.toThrow(/uuid válido/);
      await expect(repo.updateSettings("token-forjado", { weeklyTargetMinutes: 600 })).rejects.toThrow(/uuid válido/);
    });
  }
);
