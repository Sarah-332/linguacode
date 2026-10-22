import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  const client = new PrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  return client;
}

// استخدام Proxy لمنع تنفيذ الاتصال أثناء مرحلة البناء (Build time) وتأجيله لوقت الاستخدام الفعلي
export const db = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClient();
    return (client as any)[prop];
  },
});