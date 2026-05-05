import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Fall back to a syntactically-valid dummy URL when POSTGRES_URL is not
    // set (e.g. during `prisma generate` at build time). `prisma generate`
    // only reads the schema to emit TypeScript — it never opens a DB
    // connection — so the dummy value is never dialled.
    url: process.env["POSTGRES_URL"] ?? "postgresql://dummy:dummy@dummy:5432/dummy",
  },
});