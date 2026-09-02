import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { estaAutenticado } from '@/lib/auth'

// Endpoint chamado pelo SDK do Vercel Blob no navegador (ver
// components/carrossel/Carrossel.tsx) para gerar um token de upload
// direto do cliente para o Blob - o arquivo (foto/video) nunca passa
// pela nossa Function, so o token passa por aqui, o que evita o limite
// de tamanho de corpo de requisicao de uma Server Action normal.
//
// A autenticacao (mesma senha docente de lib/auth.ts) e checada em
// `onBeforeGenerateToken`, no servidor, antes de qualquer token ser
// emitido - sem sessao valida, o upload e recusado aqui, antes de
// tocar no Blob.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await estaAutenticado())) {
          throw new Error('Nao autenticado: faca login como docente antes de enviar arquivos.')
        }
        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'video/mp4',
            'video/webm',
            'video/quicktime',
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB, folga para video curto
        }
      },
      onUploadCompleted: async () => {
        // Nao gravamos no banco aqui de proposito: esse callback e um
        // webhook do Vercel Blob para a URL publica do deploy, que nao
        // chega em `npm run dev` local. O registro em CarrosselItem e
        // criado explicitamente pelo client logo apos `upload()`
        // resolver (ver actions/carrossel.ts:criarItemCarrossel),
        // assim o fluxo funciona igual em local e em producao.
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (erro) {
    return NextResponse.json(
      { error: erro instanceof Error ? erro.message : 'Erro ao gerar token de upload' },
      { status: 400 }
    )
  }
}
