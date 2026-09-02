'use client'

import { useRef, useState, useTransition } from 'react'
import { removerItemCarrossel, moverItemCarrossel } from '@/actions/carrossel'

// Carrossel institucional (fotos/videos) exibido entre "Sobre o
// projeto" e o mapa das escolas. Publico: qualquer visitante ve as
// midias, com setas/bolinhas de navegacao. Quando `autenticado` (mesma
// sessao docente de lib/auth.ts), aparece tambem o painel de
// administracao embutido: enviar novo item e reordenar/remover os
// existentes.
//
// O envio (ver enviarArquivo abaixo) passa pela nossa propria rota
// /api/admin/carrossel/upload via XMLHttpRequest (nao fetch: e o unico
// jeito simples de acompanhar o progresso de upload no navegador) em
// vez do upload direto navegador->Vercel Blob que a Vercel documenta -
// esse caminho direto esbarra num bug conhecido deles (a requisicao
// tenta passar por vercel.com/api/blob e e bloqueada por CORS). Ver o
// comentario no topo da route.ts para o detalhe completo.

export type ItemCarrossel = {
  id: number
  tipo: 'FOTO' | 'VIDEO'
  url: string
  legenda: string | null
}

type Props = {
  itens: ItemCarrossel[]
  autenticado: boolean
}

const TAMANHO_MAX_MB = 4 // limite do corpo de requisicao das Functions da Vercel (~4.5MB)
const MAX_ARQUIVOS_POR_ENVIO = 10

type RespostaUpload = { ok: true; item: unknown } | { error: string }

// XMLHttpRequest em vez de fetch: precisamos do evento de progresso de
// upload (xhr.upload.onprogress), que fetch nao expoe de forma simples
// entre navegadores.
function enviarArquivo(
  arquivo: File,
  legenda: string,
  onProgresso: (percentual: number) => void
): Promise<RespostaUpload> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.set('arquivo', arquivo)
    formData.set('legenda', legenda)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/carrossel/upload')
    xhr.upload.onprogress = (evento) => {
      if (evento.lengthComputable) onProgresso(Math.round((evento.loaded / evento.total) * 100))
    }
    xhr.onerror = () => reject(new Error('Falha de rede ao enviar o arquivo.'))
    xhr.onload = () => {
      let corpo: RespostaUpload
      try {
        corpo = JSON.parse(xhr.responseText)
      } catch {
        reject(new Error(`Resposta inesperada do servidor (status ${xhr.status}).`))
        return
      }
      if (xhr.status >= 200 && xhr.status < 300 && 'ok' in corpo) {
        resolve(corpo)
      } else {
        reject(new Error('error' in corpo ? corpo.error : `Erro ${xhr.status} ao enviar o arquivo.`))
      }
    }
    xhr.send(formData)
  })
}

export function Carrossel({ itens, autenticado }: Props) {
  const [indice, setIndice] = useState(0)
  const [pending, startTransition] = useTransition()
  const [enviando, setEnviando] = useState(false)
  const [progressoLabel, setProgressoLabel] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement | null>(null)

  const total = itens.length
  const indiceSeguro = total > 0 ? Math.min(indice, total - 1) : 0
  const atual = total > 0 ? itens[indiceSeguro] : null

  function irPara(i: number) {
    if (total === 0) return
    setIndice(((i % total) + total) % total)
  }

  // Extrai uma mensagem legivel do erro real (lancado pelo SDK do Vercel
  // Blob ou pela nossa rota /api/admin/carrossel/upload) em vez de so
  // mostrar "tente novamente" - essencial para diagnosticar problemas de
  // configuracao (ex: BLOB_READ_WRITE_TOKEN ausente) sem precisar ficar
  // trocando print com quem esta usando o site.
  function mensagemDeErro(e: unknown): string {
    if (e instanceof Error && e.message) return e.message
    return 'Erro desconhecido ao enviar o arquivo.'
  }

  async function onEnviar(formData: FormData) {
    setErro(null)
    const arquivosInput = formData.getAll('arquivos') as File[]
    const arquivos = arquivosInput.filter((a) => a && a.size > 0)
    const legenda = String(formData.get('legenda') ?? '').trim()

    if (arquivos.length === 0) {
      setErro('sem_arquivo')
      return
    }
    if (arquivos.length > MAX_ARQUIVOS_POR_ENVIO) {
      setErro('muitos_arquivos')
      return
    }
    const grandeDemais = arquivos.find((a) => a.size > TAMANHO_MAX_MB * 1024 * 1024)
    if (grandeDemais) {
      setErro('arquivo_grande')
      return
    }

    setEnviando(true)
    let enviadosComSucesso = 0
    try {
      for (let i = 0; i < arquivos.length; i++) {
        const arquivo = arquivos[i]
        const prefixo = arquivos.length > 1 ? `Enviando ${i + 1} de ${arquivos.length}` : 'Enviando'
        setProgressoLabel(`${prefixo}... 0%`)

        const resultado = await enviarArquivo(arquivo, legenda, (pct) => setProgressoLabel(`${prefixo}... ${pct}%`))
        if ('error' in resultado) {
          throw new Error(
            resultado.error === 'nao_autenticado'
              ? 'Sessão docente expirada — entre novamente e tente de novo.'
              : `Falha ao enviar "${arquivo.name}" (${resultado.error}).`
          )
        }
        enviadosComSucesso++
      }

      formRef.current?.reset()
      setIndice(total + enviadosComSucesso - 1) // pula pro ultimo item recem-adicionado
    } catch (e) {
      const jaEnviados = enviadosComSucesso > 0 ? ` (${enviadosComSucesso} de ${arquivos.length} já foram enviados com sucesso.)` : ''
      setErro(`${mensagemDeErro(e)}${jaEnviados}`)
    } finally {
      setEnviando(false)
      setProgressoLabel('')
    }
  }

  function onRemover(id: number) {
    startTransition(async () => {
      await removerItemCarrossel(id)
      setIndice((i) => Math.max(0, i - 1))
    })
  }

  function onMover(id: number, direcao: 'cima' | 'baixo') {
    startTransition(async () => {
      await moverItemCarrossel(id, direcao)
    })
  }

  return (
    <div className="carrossel card" style={{ marginBottom: 40 }}>
      <div className="carrossel-cabecalho">
        <h2 className="card-title-sm">Fotos e vídeos do projeto</h2>
        {autenticado && <span className="pill">Modo administração</span>}
      </div>

      {total === 0 ? (
        <div className="carrossel-vazio">
          <p>Em breve, fotos e vídeos do projeto vão aparecer aqui.</p>
        </div>
      ) : (
        <div className="carrossel-viewer">
          <div className="carrossel-midia">
            {atual?.tipo === 'VIDEO' ? (
              <video key={atual.url} src={atual.url} controls playsInline className="carrossel-midia-tag" />
            ) : (
              <img key={atual?.url} src={atual?.url} alt={atual?.legenda ?? 'Foto do projeto GrajaVerde'} className="carrossel-midia-tag" />
            )}
            {atual?.legenda && <div className="carrossel-legenda">{atual.legenda}</div>}

            {total > 1 && (
              <>
                <button type="button" aria-label="Anterior" className="carrossel-seta carrossel-seta-esq" onClick={() => irPara(indiceSeguro - 1)}>
                  ‹
                </button>
                <button type="button" aria-label="Próximo" className="carrossel-seta carrossel-seta-dir" onClick={() => irPara(indiceSeguro + 1)}>
                  ›
                </button>
              </>
            )}

            {autenticado && atual && (
              <div className="carrossel-admin-toolbar">
                <button type="button" className="btn-ghost" disabled={pending || indiceSeguro === 0} onClick={() => onMover(atual.id, 'cima')} style={{ padding: '4px 10px', fontSize: 12 }}>
                  ← mover
                </button>
                <button type="button" className="btn-ghost" disabled={pending || indiceSeguro === total - 1} onClick={() => onMover(atual.id, 'baixo')} style={{ padding: '4px 10px', fontSize: 12 }}>
                  mover →
                </button>
                <button type="button" className="btn-ghost" disabled={pending} onClick={() => onRemover(atual.id)} style={{ padding: '4px 10px', fontSize: 12, color: 'var(--danger)' }}>
                  Remover
                </button>
              </div>
            )}
          </div>

          {total > 1 && (
            <div className="carrossel-dots">
              {itens.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Ir para item ${i + 1}`}
                  className={`carrossel-dot${i === indiceSeguro ? ' active' : ''}`}
                  onClick={() => irPara(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {autenticado && (
        <form ref={formRef} action={onEnviar} className="carrossel-form">
          <label className="block text-sm" style={{ flex: 1, minWidth: 200 }}>
            <span className="field-label">
              Adicionar fotos ou vídeos (até {MAX_ARQUIVOS_POR_ENVIO} de uma vez, {TAMANHO_MAX_MB}MB por arquivo)
            </span>
            <input name="arquivos" type="file" accept="image/*,video/*" multiple required className="field-input" style={{ padding: 6 }} />
          </label>
          <label className="block text-sm" style={{ flex: 1, minWidth: 200 }}>
            <span className="field-label">Legenda (opcional, aplicada a todos os arquivos deste envio)</span>
            <input name="legenda" type="text" placeholder="Ex: Mutirão de plantio na EE Adriao Bernardes" className="field-input" />
          </label>
          <button type="submit" disabled={enviando} className="btn-primary">
            {enviando ? progressoLabel || 'Enviando...' : 'Enviar'}
          </button>

          {erro === 'sem_arquivo' && <p className="form-error">Escolha ao menos um arquivo antes de enviar.</p>}
          {erro === 'muitos_arquivos' && (
            <p className="form-error">Selecione no máximo {MAX_ARQUIVOS_POR_ENVIO} arquivos por envio.</p>
          )}
          {erro === 'arquivo_grande' && <p className="form-error">Um dos arquivos passa de {TAMANHO_MAX_MB}MB — escolha arquivos menores.</p>}
          {erro && !['sem_arquivo', 'muitos_arquivos', 'arquivo_grande'].includes(erro) && <p className="form-error">{erro}</p>}
        </form>
      )}
    </div>
  )
}
