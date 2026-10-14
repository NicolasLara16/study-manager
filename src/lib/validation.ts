/**
 * Barreira única de validação de entrada (docs §4).
 * Todo input externo (formulários de Server Action, Route Handlers, params)
 * passa por `parseInput(schema, data)` antes de qualquer uso.
 *
 * Em falha: lança `AppError(VALIDATION_ERROR)` com `fieldErrors` por campo —
 * message genérica e segura para o cliente; detalhes técnicos ficam só no servidor.
 */

import { z } from "zod";
import { AppError } from "@/lib/errors";

/** Converte issues do Zod em `Record<string, string[]>`, achatar paths múltiplos. */
export function fieldErrorsFromZod(error: z.ZodError<unknown>): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.length > 0 ? issue.path.map(String).join(".") : "_root";
    (fieldErrors[field] ??= []).push(issue.message);
  }
  return fieldErrors;
}

/** Valida `data` com `schema`; retorna o valor parseado ou lança AppError(VALIDATION_ERROR). */
export function parseInput<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError("VALIDATION_ERROR", {
      fieldErrors: fieldErrorsFromZod(result.error),
    });
  }
  return result.data;
}
