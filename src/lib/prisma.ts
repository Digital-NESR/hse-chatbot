import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const DB_VAR_NAMES = ['POSTGRES_HOST', 'POSTGRES_PORT', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD'] as const;

function buildConnectionString(): string {
  const { POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD } = process.env;

  // Build-time safety net: if none of the individual DB vars are present (e.g. Vercel
  // static analysis), return a dummy URL so the build doesn't crash.
  if (DB_VAR_NAMES.every((key) => !process.env[key])) {
    return 'postgresql://dummy:dummy@localhost:5432/dummy';
  }

  const missing = DB_VAR_NAMES.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required database environment variables: ${missing.join(', ')}`);
  }

  return `postgresql://${POSTGRES_USER}:${encodeURIComponent(POSTGRES_PASSWORD!)}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?uselibpqcompat=true&sslmode=require`;
}

const prismaClientSingleton = () => {
  const pool = new Pool({ connectionString: buildConnectionString() });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;