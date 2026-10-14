/** PrismaClient singleton.
 *  Server-only: esta importação impede o uso do cliente de banco em código de cliente.
 *  Em dev, a instância vive em globalThis para sobreviver ao HMR do Next
 *  (senão cada reopen de conexão esgota o pool do Postgres). */

import "server-only";

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
