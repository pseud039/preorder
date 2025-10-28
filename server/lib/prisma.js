import { PrismaClient } from "./generated/prisma/client.js";

const globalForPrisma = globalThis.__prisma || {};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = { prisma };
}
