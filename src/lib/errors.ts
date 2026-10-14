/** Erros de aplicação com código estável. Mensagens são seguras para o cliente;
 *  detalhes internos (stack, SQL) ficam apenas em `cause`, para log no servidor. */

export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL";

const defaultMessages: Record<AppErrorCode, string> = {
  UNAUTHENTICATED: "Sessão expirada. Entre novamente.",
  FORBIDDEN: "Você não tem permissão para esta ação.",
  NOT_FOUND: "Registro não encontrado.",
  VALIDATION_ERROR: "Dados inválidos.",
  CONFLICT: "Conflito com o estado atual.",
  INTERNAL: "Erro inesperado. Tente novamente.",
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    code: AppErrorCode,
    options: { message?: string; fieldErrors?: Record<string, string[]>; cause?: unknown } = {}
  ) {
    super(options.message ?? defaultMessages[code], { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.fieldErrors = options.fieldErrors;
  }
}

/** Resultado serializável para Server Actions. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string; fieldErrors?: Record<string, string[]> };

/** Converte qualquer erro em resposta segura; erros desconhecidos viram INTERNAL. */
export function toActionError(error: unknown): Extract<ActionResult<never>, { ok: false }> {
  if (error instanceof AppError) {
    return { ok: false, code: error.code, message: error.message, fieldErrors: error.fieldErrors };
  }
  console.error("[unexpected]", error);
  return { ok: false, code: "INTERNAL", message: defaultMessages.INTERNAL };
}
