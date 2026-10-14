/** Testes unitários de src/lib/time.ts — semanas segunda→domingo no fuso do usuário.
 *  Factos de calendário usados: 2026-10-12 é segunda; 2026-10-14 é quarta;
 *  2026-10-18 é domingo; 2026-11-01 é domingo; 2026-01-12 é segunda (EST). */

import { describe, expect, it } from "vitest";
import { getWeekStart, addWeeks } from "@/lib/time";

const UTC = (iso: string) => new Date(iso).getTime();

describe("getWeekStart", () => {
  it("quarta-feira cai na segunda da mesma semana (America/Sao_Paulo)", () => {
    // Segunda 12/10/2026 00:00 (-03:00) = 03:00Z — Brasil não adota DST.
    const quarta = new Date(UTC("2026-10-14T15:00:00.000Z"));
    expect(getWeekStart(quarta, "America/Sao_Paulo").getTime()).toBe(UTC("2026-10-12T03:00:00.000Z"));
  });

  it("domingo permanece na MESMA semana (último dia da semana)", () => {
    const domingo = new Date(UTC("2026-10-18T23:30:00.000Z")); // 20:30 local de domingo
    expect(getWeekStart(domingo, "America/Sao_Paulo").getTime()).toBe(UTC("2026-10-12T03:00:00.000Z"));
  });

  it("segunda logo após a meia-noite local mantém a mesma semana", () => {
    const segundaMadrugada = new Date(UTC("2026-10-12T03:15:00.000Z")); // 00:15 local
    expect(getWeekStart(segundaMadrugada, "America/Sao_Paulo").getTime()).toBe(UTC("2026-10-12T03:00:00.000Z"));
  });

  it("instante UTC de sábado pode ser sexta ou sábado LOCAL — segue o dia local", () => {
    // 01:00Z de sábado 17/10 = sexta 22:00 local → mesma semana.
    const localFriday = new Date(UTC("2026-10-17T01:00:00.000Z"));
    expect(getWeekStart(localFriday, "America/Sao_Paulo").getTime()).toBe(UTC("2026-10-12T03:00:00.000Z"));
  });

  it("retrocesso atravessa o limite do mês (domingo 1/11 → segunda 26/10)", () => {
    const domingo = new Date(UTC("2026-11-01T12:00:00.000Z"));
    expect(getWeekStart(domingo, "America/Sao_Paulo").getTime()).toBe(UTC("2026-10-26T03:00:00.000Z"));
  });

  it("fuso UTC: meia-noite local é a própria meia-noite UTC", () => {
    const quarta = new Date(UTC("2026-10-14T00:00:00.000Z"));
    expect(getWeekStart(quarta, "UTC").getTime()).toBe(UTC("2026-10-12T00:00:00.000Z"));
  });

  it("semana da virada de DST em Lisboa (dírevenida 25/10 WEST→WET)", () => {
    // Quarta 28/10 (pós-virada) → segunda 26/10 00:00 WET = 00:00Z.
    const quarta = new Date(UTC("2026-10-28T10:00:00.000Z"));
    expect(getWeekStart(quarta, "Europe/Lisbon").getTime()).toBe(UTC("2026-10-26T00:00:00.000Z"));
  });

  it("offset de inverno em Nova York: segunda 00:00 EST = 05:00Z", () => {
    const quarta = new Date(UTC("2026-01-14T18:00:00.000Z"));
    expect(getWeekStart(quarta, "America/New_York").getTime()).toBe(UTC("2026-01-12T05:00:00.000Z"));
  });

  it("fuso inválido lança erro explícito", () => {
    expect(() => getWeekStart(new Date(), "Marte/Akapnou")).toThrow(/Fuso horário inv/i);
  });

  it("horário de baixa madrugada de domingo não vira semana anterior", () => {
    const domingoDeMadrugada = new Date(UTC("2026-10-18T03:29:00.000Z")); // 00:29 local domingo
    expect(getWeekStart(domingoDeMadrugada, "America/Sao_Paulo").getTime()).toBe(UTC("2026-10-12T03:00:00.000Z"));
  });
});

describe("addWeeks", () => {
  it("avança/recua exatamente 7*n dias mantendo o instante", () => {
    const base = new Date(UTC("2026-10-12T03:00:00.000Z"));
    expect(addWeeks(base, 1).getTime()).toBe(UTC("2026-10-19T03:00:00.000Z"));
    expect(addWeeks(base, -1).getTime()).toBe(UTC("2026-10-05T03:00:00.000Z"));
    expect(addWeeks(base, 0).getTime()).toBe(base.getTime());
  });
});
