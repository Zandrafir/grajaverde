'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { sanitizarTexto, validarUrlFoto } from '@/lib/validacao'
import { estaAutenticado } from '@/lib/auth'

export type NovoPlantioInput = {
  escolaId: number
  quantidade: number
  especie?: string
  categoriaSlugs: string[]
  disciplinaEnvolvida?: string
  nomeProjeto?: string
  fotoUrls?: string[]
}

// Gate de escrita: exige o cookie de sessao docente (lib/auth.ts),
// reverificado aqui no servidor a cada chamada - nunca confia em o que
// foi renderizado no client.
export async function criarPlantio(input: NovoPlantioInput) {
  if (!(await estaAutenticado())) {
    return { ok: false, error: 'nao_autenticado' as const }
  }

  const escola = await prisma.escola.findUnique({ where: { id: input.escolaId } })
  if (!escola) {
    return { ok: false, error: 'escola_nao_encontrada' as const }
  }
  if (!input.categoriaSlugs.length) {
    return { ok: false, error: 'sem_categoria' as const }
  }
  if (!Number.isFinite(input.quantidade) || input.quantidade <= 0) {
    return { ok: false, error: 'quantidade_invalida' as const }
  }

  const fotosValidas = (input.fotoUrls ?? []).filter(validarUrlFoto)

  const categorias = await prisma.categoria.findMany({
    where: { slug: { in: input.categoriaSlugs } },
  })

  const plantio = await prisma.plantio.create({
    data: {
      escolaId: input.escolaId,
      quantidade: input.quantidade,
      especie: input.especie ? sanitizarTexto(input.especie) : undefined,
      disciplinaEnvolvida: input.disciplinaEnvolvida
        ? sanitizarTexto(input.disciplinaEnvolvida)
        : undefined,
      nomeProjeto: input.nomeProjeto ? sanitizarTexto(input.nomeProjeto) : undefined,
      categorias: {
        create: categorias.map((c: { id: number }) => ({ categoriaId: c.id })),
      },
      fotos: {
        create: fotosValidas.map((url) => ({ url })),
      },
    },
    include: { categorias: { include: { categoria: true } }, fotos: true },
  })

  // Marca a escola como participante automaticamente no primeiro
  // registro, para o professor nao precisar de dois passos separados
  // (marcar participacao + registrar plantio) no caso comum.
  if (!escola.participante) {
    await prisma.escola.update({ where: { id: input.escolaId }, data: { participante: true } })
  }

  revalidatePath('/')
  return { ok: true as const, plantio }
}

export async function listarPlantios() {
  return prisma.plantio.findMany({
    include: {
      categorias: { include: { categoria: true } },
      fotos: true,
      escola: { select: { id: true, nome: true } },
    },
    orderBy: { dataRegistro: 'desc' },
  })
}
