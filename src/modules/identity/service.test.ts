/** Testes unitários do service de identity (repository mockado via vi.mock —
 *  sem banco, validando o contrato: validação Zod → AppError → repository). */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/identity/repository", () => ({
  getProfile: vi.fn(),
  ensureProfile: vi.fn(),
  getSettings: vi.fn(),
  ensureSettings: vi.fn(),
  updateSettings: vi.fn(),
}));

import {
  getProfileService,
  ensureProfileService,
  getSettingsService,
  updateSettingsService,
} from "@/modules/identity/service";
import {
  getProfile,
  ensureProfile,
  getSettings,
  ensureSettings,
  updateSettings,
} from "@/modules/identity/repository";
import { AppError } from "@/lib/errors";
import type { Profile, UserSettings } from "@prisma/client";

const mockGetProfile = vi.mocked(getProfile);
const mockEnsureProfile = vi.mocked(ensureProfile);
const mockGetSettings = vi.mocked(getSettings);
const mockEnsureSettings = vi.mocked(ensureSettings);
const mockUpdateSettings = vi.mocked(updateSettings);

const USER = "3f6a1ec2-9b4d-4e77-9a1a-efe02c9b9f31";

const fakeProfile = { id: USER, name: "Marina Costa" } as unknown as Profile;
const fakeSettings = { userId: USER, weeklyTargetMinutes: 600 } as unknown as UserSettings;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getProfileService", () => {
  it("retorna o perfil para uuid válido", async () => {
    mockGetProfile.mockResolvedValue(fakeProfile);
    await expect(getProfileService(USER)).resolves.toEqual(fakeProfile);
  });

  it("lança NOT_FOUND quando o perfil não existe (1º acesso antes do ensure)", async () => {
    mockGetProfile.mockResolvedValue(null);
    await expect(getProfileService(USER)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("lança VALIDATION_ERROR para id de sessão malformado", async () => {
    await expect(getProfileService("token-foreach")).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(mockGetProfile).not.toHaveBeenCalled();
  });
});

describe("ensureProfileService", () => {
  it("valida o nome (trim) e delega ao repository", async () => {
    mockEnsureProfile.mockResolvedValue(fakeProfile);
    await expect(ensureProfileService(USER, "  Marina Costa  ")).resolves.toEqual(fakeProfile);
    expect(mockEnsureProfile).toHaveBeenCalledWith(USER, "Marina Costa");
  });

  it("lança VALIDATION_ERROR com fieldErrors.name quando o nome é vazio", async () => {
    const error = await ensureProfileService(USER, "   ").catch((e) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe("VALIDATION_ERROR");
    expect((error as AppError).fieldErrors?.name).toBeDefined();
    expect(mockEnsureProfile).not.toHaveBeenCalled();
  });
});

describe("getSettingsService", () => {
  it("retorna settings existentes sem criar linha", async () => {
    mockGetSettings.mockResolvedValue(fakeSettings);
    await expect(getSettingsService(USER)).resolves.toEqual(fakeSettings);
    expect(mockEnsureSettings).not.toHaveBeenCalled();
  });

  it("garante settings com defaults na primeira leitura (idempotente)", async () => {
    mockGetSettings.mockResolvedValue(null);
    mockEnsureSettings.mockResolvedValue(fakeSettings);
    await expect(getSettingsService(USER)).resolves.toEqual(fakeSettings);
    expect(mockEnsureSettings).toHaveBeenCalledWith(USER);
  });
});

describe("updateSettingsService", () => {
  const validPatch = {
    weeklyTargetMinutes: 720,
    pomodoroFocusSec: 1800,
    theme: "dark",
  };

  it("lança NOT_FOUND quando o perfil não existe", async () => {
    mockGetProfile.mockResolvedValue(null);
    await expect(updateSettingsService(USER, validPatch)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });

  it("aplica apenas os campos enviados (PATCH parcial)", async () => {
    mockGetProfile.mockResolvedValue(fakeProfile);
    mockUpdateSettings.mockResolvedValue(fakeSettings);

    await updateSettingsService(USER, validPatch);

    expect(mockUpdateSettings).toHaveBeenCalledWith(USER, {
      weeklyTargetMinutes: 720,
      pomodoroFocusSec: 1800,
      theme: "dark",
    });
  });

  it("lança VALIDATION_ERROR com fieldErrors por campo", async () => {
    mockGetProfile.mockResolvedValue(fakeProfile);

    const error = await updateSettingsService(USER, { pomodoroFocusSec: 10 }).catch((e) => e);
    expect((error as AppError).code).toBe("VALIDATION_ERROR");
    expect((error as AppError).fieldErrors?.pomodoroFocusSec).toBeDefined();
    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });

  it("lança VALIDATION_ERROR quando não há nenhum campo", async () => {
    mockGetProfile.mockResolvedValue(fakeProfile);
    await expect(updateSettingsService(USER, {})).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});
