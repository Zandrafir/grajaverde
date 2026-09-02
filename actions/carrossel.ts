'use server'

import { revalidatePath } from 'next/cache'
import { del } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { sanitizarTexto } from '@/lib/validacao'
import { estaAutenticado } from '@/lib/auth'
import type { TipoMidiaCarrossel } from '@prisma/client'

// Carrossel institucional (fotos/videos) exibido na home, entre "Sobre
// o projeto" e o mapa das escolas. O arquivo em si sobe direto do
// navegador para o Vercel Blob (ver app/api/admin/carrossel/upload/
// route.ts) - essas Server Actions so cuidam do registro no banco
// (criar, remover, reordenar), sempre reverificando a sessao docente
// aqui no servidor, igual ao resto do app (actions/plantios.ts).

export type NovoItemCarrosselInput = {
  tipo: TipoMidiaCarrossel
  url: string
  legenda?: string
}

function urlPertenceAoBlob(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
}

export async function listarCarrossel() {
  return prisma.carrosselItem.findMany({
    orderBy: [{ ordem: 'asc' }, { criadoEm: 'asc' }],
  })
}

export async function criarItemCarrossel(input: NovoItemCarrosselInput) {
  if (!(await estaAutenticado())) {
    return { ok: false, error: 'nao_autenticado' as const }
  }
  if (!urlPertenceAoBlob(input.url)) {
    return { ok: false, error: 'url_invalida' as const }
  }
  if (input.tipo !== 'FOTO' && input.tipo !== 'VIDEO') {
    return { ok: false, error: 'tipo_invalido' as const }
  }

  const ultimo = await prisma.carrosselItem.aggregate({ _max: { ordem: true } })
  const proximaOrdem = (ultimo._max.ordem ?? -1) + 1

  const item = await prisma.carrosselItem.create({
    data: {
      tipo: input.tipo,
      url: input.url,
      legenda: input.legenda ? sanitizarTexto(input.legenda, 140) : undefined,
      ordem: proximaOrdem,
    },
  })

  revalidatePath('/')
  return { ok: true as const, item }
}

export async function removerItemCarrossel(id: number) {
  if (!(await estaAutenticado())) {
    return { ok: false, error: 'nao_autenticado' as const }
  }

  const item = await prisma.carrosselItem.findUnique({ where: { id } })
  if (!item) {
    return { ok: false, error: 'nao_encontrado' as const }
  }

  await prisma.carrosselItem.delete({ where: { id } })

  // Melhor esforco: apaga o arquivo do Blob tambem. Se falhar (ex: ja
  // tinha sido removido por fora), o registro no banco ja sumiu, que e
  // o que importa para a tela publica - por isso o catch silencioso.
  try {
    await del(item.url)
  } catch (erro) {
    console.error('Falha ao remover arquivo do Blob (registro no banco ja foi removido):', erro)
  }

  revalidatePath('/')
  return { ok: true as const }
}

// Troca a posicao de um item com o vizinho (acima ou abaixo), trocando
// os valores de `ordem` dos dois - reordenacao simples via botoes de
// seta, sem exigir drag-and-drop.
export async function moverItemCarrossel(id: number, direcao: 'cima' | 'baixo') {
  if (!(await estaAutenticado())) {
    return { ok: false, error: 'nao_autenticado' as const }
  }

  const itens = await prisma.carrosselItem.findMany({
    orderBy: [{ ordem: 'asc' }, { criadoEm: 'asc' }],
  })
  const indice = itens.findIndex((i: { id: number }) => i.id === id)
  if (indice === -1) {
    return { ok: false, error: 'nao_encontrado' as const }
  }

  const indiceVizinho = direcao === 'cima' ? indice - 1 : indice + 1
  if (indiceVizinho < 0 || indiceVizinho >= itens.length) {
    return { ok: true as const } // ja esta na ponta, nada a fazer
  }

  const atual = itens[indice]
  const vizinho = itens[indiceVizinho]

  await prisma.$transaction([
    prisma.carrosselItem.update({ where: { id: atual.id }, data: { ordem: vizinho.ordem } }),
    prisma.carrosselItem.update({ where: { id: vizinho.id }, data: { ordem: atual.ordem } }),
  ])

  revalidatePath('/')
  return { ok: true as const }
}
