/** Testes unitários de src/lib/format.ts — formatação única de durações
 *  (substitui as strings de duração espalhadas pelo mock). */

import { describe, expect, it } from "vitest";
import { formatDuration, formatClock } from "@/lib/format";

describe("formatDuration", () => {
  it("abaixo de uma hora usa 'X min' (arredondado por baixo)", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(59)).toBe("0 min"); // 59s = 0 min
    expect(formatDuration(60)).toBe("1 min");
    expect(formatDuration(3125)).toBe("52 min"); // 52 minutos e 5s → 52min
  });

  it("uma hora ou mais usa 'Xh MMmin' com pad de dígito", () => {
    expect(formatDuration(3600)).toBe("1h 00min");
    expect(formatDuration(4800)).toBe("1h 20min");
    expect(formatDuration(4500)).toBe("1h 15min");
  });

  it("caso-limite 7199s não vira '1h 60min'", () => {
    expect(formatDuration(7199)).toBe("1h 59min");
    expect(formatDuration(7200)).toBe("2h 00min");
    expect(formatDuration(600)).toBe("10 min");
  });

  it("valores inválidos são tratados como 0 (defensivo)", () => {
    expect(formatDuration(-5)).toBe("0 min");
    expect(formatDuration(Number.NaN)).toBe("0 min");
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe("0 min");
  });

  it("reproduz os valores do protótipo", () => {
    expect(formatDuration(80 * 60)).toBe("1h 20min"); // "1h 20min" (Cálculo II)
    expect(formatDuration(52 * 60)).toBe("52 min"); // "52 min" (Física Moderna)
  });
});

describe("formatClock", () => {
  it("MM:SS abaixo de uma hora com zero à esquerda", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(65)).toBe("01:05");
    expect(formatClock(3125)).toBe("52:05");
  });

  it("H:MM:SS a partir de uma hora", () => {
    expect(formatClock(3600)).toBe("1:00:00");
    expect(formatClock(3665)).toBe("1:01:05");
  });

  it("entradas inválidas retornam 00:00", () => {
    expect(formatClock(-3)).toBe("00:00");
    expect(formatClock(Number.NaN)).toBe("00:00");
  });
});
