/** Schemas Zod do módulo identity — entrada única para validação de perfil e settings.
 *  Regras alinhadas a docs/fase2-relatorio-adm-eng.md §3 e aos CHECKs de
 *  prisma/sql/001_constraints_rls.sql (limites backing o banco coherentes). */

import { z } from "zod";

export const THEME_VALUES = ["light", "dark", "system"] as const;
export type ThemeValue = (typeof THEME_VALUES)[number];

/** Valida que a string é um fuso IANA suportado pelo runtime. */
export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const uuidSchema = z.string().uuid();

/** Profile: atualização de nome com trim e limites plausíveis. */
export const profileNameSchema = z
  .string()
  .trim()
  .min(1, "Nome é obrigatório.")
  .max(100, "Máximo de 100 caracteres.");

export const updateProfileSchema = z.object({
  name: profileNameSchema,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** UserSettings: PATCH parcial (apenas os campos enviados são atualizados). */
export const updateUserSettingsSchema = z
  .object({
    timezone: z.string().max(64).refine(isValidTimezone, { message: "Fuso horário inválido." }),
    weeklyTargetMinutes: z.number().int().min(1, "Mínimo de 1 minuto.").max(4200, "Máximo de 70h."),
    dailyTargetMinutes: z.number().int().min(1).max(840).nullable(),
    pomodoroFocusSec: z.number().int().min(60, "Mínimo de 1 minuto.").max(7200, "Máximo de 2h."),
    pomodoroShortBreakSec: z.number().int().min(30, "Mínimo de 30 segundos.").max(1800, "Máximo de 30 min."),
    pomodoroLongBreakSec: z.number().int().min(60, "Mínimo de 1 minuto.").max(3600, "Máximo de 60 min."),
    cyclesBeforeLongBreak: z.number().int().min(1).max(12),
    notifySessionReminders: z.boolean(),
    timerSounds: z.boolean(),
    theme: z.enum(THEME_VALUES),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Nenhum campo para atualizar." });

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
