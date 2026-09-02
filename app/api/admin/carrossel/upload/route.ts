import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { estaAutenticado } from '@/lib/auth'
import { criarItemCarrossel } from '@/actions/carrossel'

// Upload do carrossel institucional, proxiado pelo nosso servidor: o
// arquivo sobe do navegador ate esta rota (multipart/form-data) e daqui
// vai pro Vercel Blob com `put()`.
//
// Por que nao o fluxo "client upload" (upload direto navegador -> Blob
// com handleUpload/token) documentado pela Vercel: em alguns projetos
// (o nosso incluso) esse fluxo tenta passar por
// https://vercel.com/api/blob e e bloqueado por CORS no navegador - bug
// conhecido e sem previsao de correcao do lado da Vercel (ver
// community.vercel.com, thread "Vercel Blob client upload blocked by
// CORS"). Proxiar pela nossa rota evita esse caminho inteiro.
//
// Contrapartida: o corpo da requisicao passa pela nossa Function, que
// na Vercel (Hobby/Pro) tem limite de ~4.5MB por requisicao - por isso
// TAMANHO_MAX_BYTES fica com folga abaixo disso. Fotos de celular cabem
// tranquilamente; videos maiores que isso nao vao caber neste caminho.
const TIPOS_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]
const TAMANHO_MAX_BYTES = 4 * 1024 * 1024 // 4MB - Functions da Vercel aceitam ate ~4.5MB de corpo

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await estaAutenticado())) {
    return NextResponse.json({ error: 'nao_autenticado' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'requisicao_invalida' }, { status: 400 })
  }

  const arquivo = formData.get('arquivo')
  const legenda = String(formData.get('legenda') ?? '').trim()

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return NextResponse.json({ error: 'sem_arquivo' }, { status: 400 })
  }
  if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
    return NextResponse.json({ error: 'tipo_nao_permitido' }, { status: 400 })
  }
  if (arquivo.size > TAMANHO_MAX_BYTES) {
    return NextResponse.json({ error: 'arquivo_grande' }, { status: 413 })
  }

  const tipo = arquivo.type.startsWith('video/') ? 'VIDEO' : 'FOTO'

  try {
    const blob = await put(arquivo.name, arquivo, { access: 'public', addRandomSuffix: true })

    const resultado = await criarItemCarrossel({ tipo, url: blob.url, legenda: legenda || undefined })
    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true, item: resultado.item })
  } catch (erro) {
    console.error('Falha ao enviar midia do carrossel:', erro)
    // Devolve a mensagem real do erro (do Vercel Blob ou do Prisma) em
    // vez de um "falha_upload" generico - essencial pra diagnosticar
    // problemas de configuracao (token, banco) direto pela tela, sem
    // depender dos logs da Vercel a cada tentativa.
    const mensagem = erro instanceof Error ? erro.message : 'Erro desconhecido ao enviar o arquivo.'
    return NextResponse.json({ error: mensagem }, { status: 500 })
  }
}
