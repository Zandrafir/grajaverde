import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/export?de=2026-01-01&ate=2026-12-31&categoria=cerrado
// Gera o CSV no server (mais confiavel para relatorios grandes do que
// montar o Blob inteiramente no client) e devolve como download.
// O botao no dashboard pode tanto linkar direto para esta rota quanto
// buscar o texto aqui e disparar o download via Blob API no client -
// a geracao dos dados fica sempre centralizada aqui.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const de = searchParams.get('de')
  const ate = searchParams.get('ate')
  const categoria = searchParams.get('categoria')

  const plantios = await prisma.plantio.findMany({
    where: {
      dataRegistro: {
        gte: de ? new Date(de) : undefined,
        lte: ate ? new Date(ate) : undefined,
      },
      categorias: categoria
        ? { some: { categoria: { slug: categoria } } }
        : undefined,
    },
    include: { escola: true, categorias: { include: { categoria: true } } },
    orderBy: { dataRegistro: 'asc' },
  })

  const cabecalho = [
    'escola',
    'data',
    'quantidade',
    'especie',
    'categorias',
    'disciplina_envolvida',
    'nome_projeto',
  ]

  type LinhaExport = {
    escola: { nome: string }
    dataRegistro: Date
    quantidade: number
    especie: string | null
    categorias: { categoria: { nome: string } }[]
    disciplinaEnvolvida: string | null
    nomeProjeto: string | null
  }

  const linhas = (plantios as LinhaExport[]).map((p) =>
    [
      p.escola.nome,
      p.dataRegistro.toISOString().slice(0, 10),
      String(p.quantidade),
      p.especie ?? '',
      p.categorias.map((c) => c.categoria.nome).join('; '),
      p.disciplinaEnvolvida ?? '',
      p.nomeProjeto ?? '',
    ]
      .map((campo) => `"${campo.replace(/"/g, '""')}"`)
      .join(',')
  )

  const csv = [cabecalho.join(','), ...linhas].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="verde-do-grajau-plantios.csv"',
    },
  })
}
