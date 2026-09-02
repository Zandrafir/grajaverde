import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/escolas - listagem publica (somente leitura) usada por
// integracoes externas ou por revalidacao client-side pontual. O fluxo
// principal de leitura fica no Server Component (app/page.tsx); esta
// rota existe para consumidores que nao sao a propria pagina Next.js.
export async function GET() {
  // select explicito: esta rota e publica, entao `tokenEdicao` nunca
  // pode aparecer na resposta (mesma regra aplicada em app/page.tsx).
  const escolas = await prisma.escola.findMany({
    select: {
      id: true,
      nome: true,
      participante: true,
      latitude: true,
      longitude: true,
      aproximado: true,
    },
    orderBy: { nome: 'asc' },
  })
  return NextResponse.json(escolas)
}
