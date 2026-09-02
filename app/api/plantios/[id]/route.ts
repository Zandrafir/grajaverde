import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const plantio = await prisma.plantio.findUnique({
    where: { id: Number(id) },
    include: {
      categorias: { include: { categoria: true } },
      fotos: true,
      // select explicito: rota publica, `tokenEdicao` da escola nunca
      // pode aparecer na resposta.
      escola: { select: { id: true, nome: true } },
    },
  })
  if (!plantio) {
    return NextResponse.json({ error: 'nao_encontrado' }, { status: 404 })
  }
  return NextResponse.json(plantio)
}
