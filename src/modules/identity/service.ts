/** Service do módulo identity — casos de uso de perfil e configurações.
 *  Camada usada por Server Actions e RSCs. Fluxo: validação (Zod) → repository.
 *  Erros de aplicação são AppError de src/lib/errors.ts (códigos estáveis);
 *  mensagens são seguras para o cliente e fieldErrors alimentam os formulários. */

import "server-only";

import { AppError } from "@/lib/errors";
import { ZodError, type ZodType } from "zod";
import {
  profileNameSchema,
  updateProfileSchema,
  updateUserSettingsSchema,
  uuidSchema,
  type UpdateUserSettingsInput,
} from "@/modules/identity/schemas";
import {
  ensureProfile,
  ensureSettings,
  getProfile,
  getSettings,
  updateSettings,
} from "@/modules/identity/repository";
import type { Profile, UserSettings } from "@prisma/client";

/** Converte falha de Zod em VALIDATION_ERROR com fieldErrors por campo (pt-BR). */
function toValidationError(error: unknown): AppError {
  const fieldErrors: Record<string, string[]> = {};

  if (error instanceof ZodError) {
    for (const issue of error.issues) {
      const path = issue.path.map(String).join(".") || "_";
      (fieldErrors[path] ??= []).push(issue.message);
    }
  }

  return new AppError("VALIDATION_ERROR", { fieldErrors });
}

/** Parseia `input` com `schema` ou lança AppError(VALIDATION_ERROR). */
function parseOrThrow<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw toValidationError(result.error);
  }
  return result.data;
}

/** Perfil real do usuário logado; NOT_FOUND quando o perfil ainda não existe
 *  (primeira sessão antes do ensureProfile). Página de configuração usa o
 *  service de cima; quem CHAMA decide redirect/onboarding. */
export async function getProfileService(userId: string): Promise<Profile> {
  const id = parseOrThrow(uuidSchema, userId);

  const profile = await getProfile(id);
  if (!profile) {
    throw new AppError("NOT_FOUND", { message: "Perfil não encontrado." });
  }
  return profile;
}

/** Garante o perfil no primeiro login (id = auth uid). Não sobrescreve nome já existente. */
export async function ensureProfileService(userId: string, rawName: unknown): Promise<Profile> {
  const id = parseOrThrow(uuidSchema, userId);
  // parse pelo objeto para o fieldError vencer o caminho ["name"] no cliente
  const { name } = parseOrThrow(updateProfileSchema, { name: rawName });

  return ensureProfile(id, name);
}

/** Settings garantidos (primeira leitura cria a linha com os defaults do schema). */
export async function getSettingsService(userId: string): Promise<UserSettings> {
  const id = parseOrThrow(uuidSchema, userId);

  const existing = await getSettings(id);
  if (existing) return existing;

  return ensureSettings(id);
}

/** PATCH parcial dos settings. Validação Zod → repository. Perfil inexistente → NOT_FOUND. */
export async function updateSettingsService(
  userId: string,
  rawInput: unknown
): Promise<UserSettings> {
  const id = parseOrThrow(uuidSchema, userId);
  const parsed: UpdateUserSettingsInput = parseOrThrow(updateUserSettingsSchema, rawInput);

  const profile = await getProfile(id);
  if (!profile) {
    throw new AppError("NOT_FOUND", { message: "Perfil não encontrado." });
  }

  // payload já validado campo a campo é o próprio SettingsPatch
  return updateSettings(id, parsed);
}

/** Reexportado para Server Actions validarem payloads antes do service. */
export const schemas = {
  updateProfile: updateProfileSchema,
  updateUserSettings: updateUserSettingsSchema,
};
