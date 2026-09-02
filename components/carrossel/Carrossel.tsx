'use client'

import { useRef, useState, useTransition } from 'react'
import { upload } from '@vercel/blob/client'
import { criarItemCarrossel, removerItemCarrossel, moverItemCarrossel } from '@/actions/carrossel'

// Carrossel institucional (fotos/videos) exibido entre "Sobre o
// projeto" e o mapa das escolas. Publico: qualquer visitante ve as
// midias, com setas/bolinhas de navegacao. Quando `autenticado` (mesma
// sessao docente de lib/auth.ts), aparece tambem o painel de
// administracao embutido: enviar novo item (upload direto pro Vercel
// Blob, sem passar pela nossa Function - ver app/api/admin/carrossel/
// upload/route.ts) e reordenar/remover os existentes.

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

const TAMANHO_MAX_MB = 100

export function Carrossel({ itens, autenticado }: Props) {
  const [indice, setIndice] = useState(0)
  const [pending, startTransition] = useTransition()
  const [enviando, setEnviando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement | null>(null)

  const total = itens.length
  const indiceSeguro = total > 0 ? Math.min(indice, total - 1) : 0
  const atual = total > 0 ? itens[indiceSeguro] : null

  function irPara(i: number) {
    if (total === 0) return
    setIndice(((i % total) + total) % total)
  }

  async function onEnviar(formData: FormData) {
    setErro(null)
    const arquivo = formData.get('arquivo') as File | null
    const legenda = String(formData.get('legenda') ?? '').trim()

    if (!arquivo || arquivo.size === 0) {
      setErro('sem_arquivo')
      return
    }
    if (arquivo.size > TAMANHO_MAX_MB * 1024 * 1024) {
      setErro('arquivo_grande')
      return
    }

    const tipo = arquivo.type.startsWith('video/') ? 'VIDEO' : 'FOTO'

    setEnviando(true)
    setProgresso(0)
    try {
      const blob = await upload(arquivo.name, arquivo, {
        access: 'public',
        handleUploadUrl: '/api/admin/carrossel/upload',
        onUploadProgress: (evento) => setProgresso(Math.round(evento.percentage)),
      })

      const resultado = await criarItemCarrossel({ tipo, url: blob.url, legenda: legenda || undefined })
      if (!resultado.ok) {
        setErro(resultado.error)
        return
      }
      formRef.current?.reset()
      setIndice(total) // pula pro item recem-adicionado (agora o ultimo)
    } catch {
      setErro('falha_upload')
    } finally {
      setEnviando(false)
      setProgresso(0)
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
            <span className="field-label">Adicionar foto ou vídeo</span>
            <input name="arquivo" type="file" accept="image/*,video/*" required className="field-input" style={{ padding: 6 }} />
          </label>
          <label className="block text-sm" style={{ flex: 1, minWidth: 200 }}>
            <span className="field-label">Legenda (opcional)</span>
            <input name="legenda" type="text" placeholder="Ex: Mutirão de plantio na EE Adriao Bernardes" className="field-input" />
          </label>
          <button type="submit" disabled={enviando} className="btn-primary">
            {enviando ? `Enviando... ${progresso}%` : 'Enviar'}
          </button>

          {erro === 'sem_arquivo' && <p className="form-error">Escolha um arquivo antes de enviar.</p>}
          {erro === 'arquivo_grande' && <p className="form-error">Arquivo maior que {TAMANHO_MAX_MB}MB — escolha um arquivo menor.</p>}
          {erro === 'falha_upload' && <p className="form-error">Não foi possível enviar o arquivo. Tente novamente.</p>}
          {erro === 'nao_autenticado' && <p className="form-error">Sessão docente expirada — entre novamente.</p>}
          {erro === 'url_invalida' && <p className="form-error">Falha ao registrar o arquivo enviado. Tente novamente.</p>}
        </form>
      )}
    </div>
  )
}
