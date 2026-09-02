'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { estaAutenticado } from '@/lib/auth'

// Gate de escrita: exige o cookie de sessao docente (lib/auth.ts),
// reverificado aqui no servidor a cada chamada - nunca confia em o que
// foi renderizado no client.
export async function alternarParticipacao(escolaId: number) {
  if (!(await estaAutenticado())) {
    return { ok: false, error: 'nao_autenticado' as const }
  }

  const escola = await prisma.escola.findUnique({ where: { id: escolaId } })
  if (!escola) {
    return { ok: false, error: 'escola_nao_encontrada' as const }
  }

  await prisma.escola.update({
    where: { id: escolaId },
    data: { participante: !escola.participante },
  })

  revalidatePath('/')
  return { ok: true as const }
}

export async function listarEscolas() {
  return prisma.escola.findMany({
    select: {
      id: true,
      nome: true,
      endereco: true,
      participante: true,
      latitude: true,
      longitude: true,
      aproximado: true,
    },
    orderBy: { nome: 'asc' },
  })
}
