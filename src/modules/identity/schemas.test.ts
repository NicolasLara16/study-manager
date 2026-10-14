/** Testes unitários de src/modules/identity/schemas.ts (Zod puro, sem I/O). */

import { describe, expect, it } from "vitest";
import {
  updateUserSettingsSchema,
  updateProfileSchema,
  uuidSchema,
  isValidTimezone,
} from "@/modules/identity/schemas";

describe("uuidSchema", () => {
  it("aceita uuid v4 válido", () => {
    expect(uuidSchema.safeParse("3f6a1ec2-9b4d-4e77-9a1a-efe02c9b9f31").success).toBe(true);
  });

  it("rejeita id alheio/malformado (vetor de isolamento)", () => {
    expect(uuidSchema.safeParse("não-é-um-uuid").success).toBe(false);
    expect(uuidSchema.safeParse("").success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("aceita nome válido e aplica trim", () => {
    const result = updateProfileSchema.safeParse({ name: "  Marina Costa  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Marina Costa");
  });

  it("rejeita nome vazio, apenas espaços e acima de 100 caracteres", () => {
    expect(updateProfileSchema.safeParse({ name: "" }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ name: "x".repeat(101) }).success).toBe(false);
  });
});

describe("isValidTimezone", () => {
  it("aceita fuso IANA e UTC", () => {
    expect(isValidTimezone("America/Sao_Paulo")).toBe(true);
    expect(isValidTimezone("Europe/Lisbon")).toBe(true);
    expect(isValidTimezone("UTC")).toBe(true);
  });

  it("rejeita fuso inexistente", () => {
    expect(isValidTimezone("Marte/Atarkdia")).toBe(false);
    expect(isValidTimezone("")).toBe(false);
  });
});

describe("updateUserSettingsSchema", () => {
  const validBase = {
    timezone: "America/Sao_Paulo",
    weeklyTargetMinutes: 600,
    pomodoroFocusSec: 1500,
    pomodoroShortBreakSec: 300,
    pomodoroLongBreakSec: 900,
    cyclesBeforeLongBreak: 4,
    theme: "dark",
    notifySessionReminders: true,
    timerSounds: false,
    dailyTargetMinutes: 150,
  };

  it("aceita payload completo coerente com os defaults", () => {
    expect(updateUserSettingsSchema.safeParse(validBase).success).toBe(true);
  });

  it("é parcial: aceita apenas um campo", () => {
    const result = updateUserSettingsSchema.safeParse({ weeklyTargetMinutes: 720 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ weeklyTargetMinutes: 720 });
  });

  it("payload vazio é rejeitado (nada a atualizar)", () => {
    expect(updateUserSettingsSchema.safeParse({}).success).toBe(false);
  });

  it("rejeita metas não positivas e acima do teto (70h)", () => {
    expect(updateUserSettingsSchema.safeParse({ ...validBase, weeklyTargetMinutes: 0 }).success).toBe(false);
    expect(updateUserSettingsSchema.safeParse({ ...validBase, weeklyTargetMinutes: 4201 }).success).toBe(false);
    expect(updateUserSettingsSchema.safeParse({ ...validBase, dailyTargetMinutes: 0 }).success).toBe(false);
    expect(updateUserSettingsSchema.safeParse({ ...validBase, dailyTargetMinutes: -3 }).success).toBe(false);
  });

  it("rejeita durações de pomodoro fora dos limites dos CHECKs do banco", () => {
    expect(updateUserSettingsSchema.safeParse({ ...validBase, pomodoroFocusSec: 59 }).success).toBe(false);
    expect(updateUserSettingsSchema.safeParse({ ...validBase, pomodoroShortBreakSec: 29 }).success).toBe(false);
    expect(updateUserSettingsSchema.safeParse({ ...validBase, pomodoroLongBreakSec: 3601 }).success).toBe(false);
    expect(updateUserSettingsSchema.safeParse({ ...validBase, cyclesBeforeLongBreak: 13 }).success).toBe(false);
  });

  it("rejeita theme fora de light|dark|system", () => {
    expect(updateUserSettingsSchema.safeParse({ ...validBase, theme: "neon" }).success).toBe(false);
  });

  it("rejeita timezone inexistente", () => {
    expect(updateUserSettingsSchema.safeParse({ ...validBase, timezone: "Brasil/Centro" }).success).toBe(false);
  });

  it("não-inteiros são rejeitados (números fracionários de segundos)", () => {
    expect(updateUserSettingsSchema.safeParse({ ...validBase, pomodoroFocusSec: 90.5 }).success).toBe(false);
  });
});
