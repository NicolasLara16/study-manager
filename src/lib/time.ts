/** Utilidades de tempo — fonte única de cálculo de semanas (segunda→domingo)
 *  no fuso do usuário. Funções puras (sem I/O) testáveis.
 *
 *  Contratos centrais:
 *  - "Semana" do Study Manager começa na SEGUNDA-FEIRA no fuso local do usuário.
 *  - getWeekStart(date, tz) devolve o instante exato de meia-noite LOCAL da
 *    segunda-feira da semana que contém `date`.
 *  - Datas persistidas ficam em UTC; o "dia local" é sempre derivado por tz.
 */

/** Weekday longo do Intl (en-US) → índice (0 = segunda). */
const WEEKDAY_INDEX: Record<string, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

function validateTimezone(tz: string): void {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch {
    throw new Error(`Fuso horário inválido ou desconhecido: "${tz}"`);
  }
}

/** Partes de calendário locais (no fuso `tz`) de um instante UTC. */
function getZonedDateTimeParts(date: Date, tz: string): {
  year: number;
  month: number;
  day: number;
  weekdayIndex: number;
} {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  });
  const parts = Object.fromEntries(
    dtf
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value] as const)
  );

  const weekdayIndex = WEEKDAY_INDEX[parts.weekday];
  if (weekdayIndex === undefined) {
    throw new Error(`Weekday desconhecido: "${parts.weekday}"`);
  }

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekdayIndex,
  };
}

/** Offset (ms) entre o relógio local (fuso `tz`) e o instante UTC naquele momento. */
function timezoneOffsetMs(date: Date, tz: string): number {
  const { year, month, day } = getZonedDateTimeParts(date, tz);
  // Hora sem "24" (formatToParts pode devolver 24 em fusos extremos, ex. +14h)
  const timeParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value] as const)
  );
  const hour = timeParts.hour === "24" ? 0 : Number(timeParts.hour);

  const asUtc = Date.UTC(year, month - 1, day, hour, Number(timeParts.minute), Number(timeParts.second));
  return asUtc - date.getTime();
}

/** Converte data-hora LOCAL (numérica, no fuso `tz`) para o instante UTC correspondente.
 *  Resolve por fixpoint com o alvo FIXO (algoritmo tipo Luxon): candidato = alvoLocal
 *  − offset(candidato). Iterado até estabilizar — cobre transições de DST na meia-noite. */
function fromZonedTime(
  year: number,
  month: number,
  day: number,
  tz: string,
  hour = 0,
  minute = 0,
  second = 0
): Date {
  const target = Date.UTC(year, month - 1, day, hour, minute, second);
  let guess = target;

  for (let i = 0; i < 3; i++) {
    const candidate = target - timezoneOffsetMs(new Date(guess), tz);
    if (candidate === guess) break;
    guess = candidate;
  }
  return new Date(guess);
}

/** Instante de meia-noite LOCAL (no fuso tz) da segunda-feira da semana que contém `date`. */
export function getWeekStart(date: Date, tz: string): Date {
  validateTimezone(tz);

  const parts = getZonedDateTimeParts(date, tz);
  const mondayDay = parts.day - parts.weekdayIndex; // volta até segunda (pode "sair do mês" — Date.UTC normaliza)

  let result = fromZonedTime(parts.year, parts.month, mondayDay, tz);

  // Guarda: re-deriva o dia do resultado e corrige ±7 dias se necessário.
  const verify = getZonedDateTimeParts(result, tz);
  if (verify.weekdayIndex !== 0) {
    const correction = 0 - verify.weekdayIndex;
    result = fromZonedTime(verify.year, verify.month, verify.day + correction, tz);
  }

  return result;
}

/** Soma n semanas a um início de semana (instante de segunda local). */
export function addWeeks(weekStart: Date, weeks: number): Date {
  return new Date(weekStart.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
}
