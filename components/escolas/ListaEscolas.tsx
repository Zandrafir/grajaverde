'use client'

// Grade com as 57 escolas (Eixo "lista" do artefato original: la, a lista
// e o mapa eram duas abas da mesma secao "Escolas participantes"). Aqui
// ficam sempre visiveis lado a lado com o mapa - ver PainelEscolas.tsx,
// que tambem controla o modal aberto ao clicar em um card e calcula os
// indicadores do Passaporte de Conquistas por escola.
//
// Cada card mostra os selos (badges circulares) diretamente, sem
// precisar abrir o modal - versao compacta do Passaporte completo
// (components/gamificacao/Passaporte.tsx), que continua exibindo o
// criterio e o progresso numerico por extenso dentro do EscolaModal.

import Image from 'next/image'
import { useMemo, useState } from 'react'
import type { Indicador } from '@/lib/agregacoes'

type EscolaRow = {
  id: number
  nome: string
  participante: boolean
  aproximado: boolean
}

type Props = {
  escolas: EscolaRow[]
  totalPorEscola: Map<number, number>
  indicadoresPorEscola: Map<number, Indicador[]>
  escolaSelecionadaId: number | null
  onSelecionarEscola: (id: number) => void
}

export function ListaEscolas({
  escolas,
  totalPorEscola,
  indicadoresPorEscola,
  escolaSelecionadaId,
  onSelecionarEscola,
}: Props) {
  const [busca, setBusca] = useState('')

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const base = termo ? escolas.filter((e) => e.nome.toLowerCase().includes(termo)) : escolas
    // participantes primeiro, depois ordem alfabetica (escolas ja vem
    // ordenadas por nome do Server Component)
    return [...base].sort((a, b) => Number(b.participante) - Number(a.participante))
  }, [escolas, busca])

  return (
    <div>
      <label className="sr-only" htmlFor="busca-escola">
        Buscar escola
      </label>
      <input
        id="busca-escola"
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder={`Buscar entre as ${escolas.length} escolas...`}
        className="search-input"
      />

      <div className="school-list">
        {filtradas.map((e) => {
          const indicadores = indicadoresPorEscola.get(e.id) ?? []
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => onSelecionarEscola(e.id)}
              className={`school-card${e.id === escolaSelecionadaId ? ' selected' : ''}`}
            >
              <div className="school-row">
                <span className="school-name">{e.nome}</span>
                {e.participante && <span className="participates-badge">Participa</span>}
              </div>
              <div className="school-meta">
                {totalPorEscola.get(e.id) ?? 0} muda(s) plantada(s)
                {e.aproximado ? ' · localização aproximada' : ''}
              </div>
              {indicadores.length > 0 && (
                <div className="badges">
                  {indicadores.map((ind) => (
                    <div
                      key={ind.id}
                      className={`badge ${ind.atingido ? 'active' : 'inactive'}`}
                      title={`${ind.titulo} — ${ind.criterio}`}
                    >
                      <Image src={ind.imagem} alt="" width={40} height={40} className="badge-img" />
                    </div>
                  ))}
                </div>
              )}
            </button>
          )
        })}

        {filtradas.length === 0 && (
          <p className="empty-note" style={{ textAlign: 'center' }}>
            Nenhuma escola encontrada para &ldquo;{busca}&rdquo;.
          </p>
        )}
      </div>
    </div>
  )
}
