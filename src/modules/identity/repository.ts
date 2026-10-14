/** Repository do módulo identity — ÚNICO acesso a banco deste módulo.
 *  REGRA DE ISOLAMENTO: toda função recebe `userId` como 1º argumento e filtra
 *  por ele. Nenhuma query é executada sem escopo de usuário.
 *  (O Prisma NÃO é protegido pelo RLS do Supabase — a barreira efetiva fica aqui,
 *  garantida por testes de isolamento entre usuários.) */

import "server-only";

import { db } from "@/lib/db";
import type { Profile, UserSettings, Prisma, ThemeChoice } from "@prisma/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Evita erros de cast P2020 do Prisma quando o token de sessão chega malformado. */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Perfil do usuário (id = auth uid); null quando inexistente ou id inválido. */
export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isUuid(userId)) return null;

  return db.profile.findUnique({ where: { id: userId } });
}

/** Garante a existência do perfil (id = auth uid; o default do uuid nunca é usado).
 *  Se o perfil já existe, o nome atual NÃO é sobrescrito — semântica de "ensure":
 *  o nome alterado pelo usuário em Configurações prevalece. */
export async function ensureProfile(userId: string, name: string): Promise<Profile> {
  if (!isUuid(userId)) {
    throw new Error("ensureProfile: userId não é um uuid válido");
  }

  return db.profile.upsert({
    where: { id: userId },
    create: { id: userId, name },
    update: {},
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      termsAcceptedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/** Settings do usuário; null quando nunca foram criados. */
export async function getSettings(userId: string): Promise<UserSettings | null> {
  if (!isUuid(userId)) return null;

  return db.userSettings.findUnique({ where: { userId } });
}

/** Cria settings com os defaults do schema quando ainda não existem (idempotente). */
export async function ensureSettings(userId: string): Promise<UserSettings> {
  if (!isUuid(userId)) {
    throw new Error("ensureSettings: userId não é um uuid válido");
  }

  return db.userSettings.upsert({
    where: { userId },
    create: { profile: { connect: { id: userId } } },
    update: {},
  });
}

/** PATCH parcial de settings (campos já validados pelo service). Upsert para que o
 *  primeiro "Salvar alterações" de Configurações crie a linha sem onboarding prévio. */
export type SettingsPatch = Partial<{
  timezone: string;
  weeklyTargetMinutes: number;
  dailyTargetMinutes: number | null;
  pomodoroFocusSec: number;
  pomodoroShortBreakSec: number;
  pomodoroLongBreakSec: number;
  cyclesBeforeLongBreak: number;
  notifySessionReminders: boolean;
  timerSounds: boolean;
  theme: ThemeChoice;
}>;

export async function updateSettings(userId: string, input: SettingsPatch): Promise<UserSettings> {
  if (!isUuid(userId)) {
    throw new Error("updateSettings: userId não é um uuid válido");
  }

  return db.userSettings.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  });
}
