import { describe, expect, it } from "vitest";
import { z } from "zod";

import { AppError } from "@/lib/errors";
import { fieldErrorsFromZod, parseInput } from "@/lib/validation";

const schema = z.object({
  name: z.string().min(1),
  weeklyHours: z.number().int().positive(),
});

describe("parseInput", () => {
  it("retorna o valor parseado quando os dados são válidos", () => {
    const data = parseInput(schema, { name: "CNU", weeklyHours: 10 });
    expect(data).toEqual({ name: "CNU", weeklyHours: 10 });
  });

  it("aplica defaults do schema no retorno", () => {
    const withDefault = z.object({ role: z.string().default("user") });
    expect(parseInput(withDefault, {})).toEqual({ role: "user" });
  });

  it("lança AppError em falha de validação", () => {
    expect(() => parseInput(schema, { name: "", weeklyHours: 0 })).toThrow(AppError);
  });

  it("erro tem código estável VALIDATION_ERROR e mensagem genérica (segura p/ cliente)", () => {
    try {
      parseInput(schema, { name: "", weeklyHours: 0 });
      expect.unreachable("deveria ter lançado");
    } catch (e) {
      const error = e as AppError;
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("Dados inválidos.");
      expect(error.fieldErrors).toEqual({
        name: expect.any(Array),
        weeklyHours: expect.any(Array),
      });
    }
  });

  it("achata paths aninhados como user.email em fieldErrors", () => {
    try {
      parseInput(z.object({ user: z.object({ email: z.string().email() }) }), {
        user: { email: "nope" },
      });
      expect.unreachable("deveria ter lançado");
    } catch (e) {
      const error = e as AppError;
      expect(Object.keys(error.fieldErrors ?? {})).toEqual(["user.email"]);
    }
  });

  it("input totalmente inválido (tipo errado, null, undefined) também falha", () => {
    expect(() => parseInput(schema, null)).toThrow(AppError);
    expect(() => parseInput(schema, undefined)).toThrow(AppError);
    expect(() => parseInput(schema, "string")).toThrow(AppError);
  });

  it("não vaza valores do payload na mensagem do AppError", () => {
    try {
      parseInput(schema, { name: "valor-sensivel", weeklyHours: -5 });
      expect.unreachable("deveria ter lançado");
    } catch (e) {
      const error = e as AppError;
      expect(error.message).toBe("Dados inválidos.");
    }
  });
});

describe("fieldErrorsFromZod", () => {
  it("agrupa múltiplos issues do mesmo campo em array", () => {
    const result = schema.safeParse({ name: "", weeklyHours: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = fieldErrorsFromZod(result.error);
      expect(fieldErrors.weeklyHours!.length).toBeGreaterThan(0);
      expect(typeof fieldErrors.weeklyHours![0]).toBe("string");
    }
  });
});
