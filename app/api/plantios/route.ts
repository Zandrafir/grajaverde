import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { criarPlantio, type NovoPlantioInput } from '@/actions/plantios'

// GET /api/plantios - listagem publica, usada por consumidores externos
// (ex: um script de exportacao rodando fora do navegador).
export async function GET() {
  // select explicito para `escola`: rota publica, `tokenEdicao` nunca
  // pode aparecer na resposta.
  const plantios = await prisma.plantio.findMany({
    include: {
      categorias: { include: { categoria: true } },
      fotos: true,
      escola: { select: { id: true, nome: true } },
    },
    orderBy: { dataRegistro: 'desc' },
  })
  return NextResponse.json(plantios)
}

// POST /api/plantios - alternativa via API REST a Server Action
// `criarPlantio` (actions/plantios.ts), para clientes que nao usam
// Server Actions do Next.js (ex: um app mobile futuro).
export async function POST(request: Request) {
  const body = (await request.json()) as NovoPlantioInput
  const resultado = await criarPlantio(body)
  if (!resultado.ok) {
    return NextResponse.json(resultado, { status: 400 })
  }
  return NextResponse.json(resultado, { status: 201 })
}
