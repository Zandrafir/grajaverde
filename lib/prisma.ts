import { PrismaClient } from '@prisma/client'

// Singleton do PrismaClient. Em desenvolvimento, o Next.js recarrega
// modulos a cada mudanca de arquivo (Fast Refresh); sem esse cache em
// `globalThis`, cada reload criaria um novo PrismaClient e, por sua vez,
// uma nova conexao, esgotando o limite de conexoes do Neon rapidamente.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
