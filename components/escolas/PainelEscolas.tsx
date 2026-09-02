'use client'

// Componente pai que possui a selecao de escola (id) compartilhada pelo
// mapa E pela lista - qualquer um dos dois pode abrir o mesmo
// EscolaModal, com as mesmas estatisticas reais calculadas aqui a
// partir da prop `plantios` (vinda do Server Component em app/page.tsx).
// Mantem o mapa/lista "burros": eles so recebem `escolas` e emitem
// `onSelecionarEscola`, sem saber nada sobre o modal.
//
// Tambem calcula os indicadores do Passaporte de Conquistas por escola
// (lib/agregacoes.ts:calcularSelos) para os selos aparecerem direto nos
// cards da lista, sem precisar abrir o modal.

import { useMemo, useState } from 'react'
import { MapaInterativo } from '@/components/mapa/MapaInterativo'
import { ListaEscolas } from '@/components/escolas/ListaEscolas'
import { EscolaModal } from '@/components/mapa/EscolaModal'
import { calcularSelos, type Indicador, type PlantioComCategorias } from '@/lib/agregacoes'

type EscolaRow = {
  id: number
  nome: string
  participante: boolean
  latitude: number | null
  longitude: number | null
  aproximado: boolean
}

type PlantioRow = PlantioComCategorias & {
  escolaId: number
  fotos: { id: number; url: string }[]
}

type Props = {
  escolas: EscolaRow[]
  plantios: PlantioRow[]
  autenticado: boolean
}

export function PainelEscolas({ escolas, plantios, autenticado }: Props) {
  const [escolaSelecionadaId, setEscolaSelecionadaId] = useState<number | null>(null)

  const plantiosPorEscola = useMemo(() => {
    const mapa = new Map<number, PlantioRow[]>()
    for (const p of plantios) {
      const atual = mapa.get(p.escolaId) ?? []
      atual.push(p)
      mapa.set(p.escolaId, atual)
    }
    return mapa
  }, [plantios])

  const estatisticasPorEscola = useMemo(() => {
    const mapa = new Map<number, { total: number; fotos: { id: number; url: string }[] }>()
    for (const p of plantios) {
      const atual = mapa.get(p.escolaId) ?? { total: 0, fotos: [] }
      atual.total += p.quantidade
      atual.fotos.push(...p.fotos)
      mapa.set(p.escolaId, atual)
    }
    return mapa
  }, [plantios])

  const totalPorEscola = useMemo(() => {
    const mapa = new Map<number, number>()
    for (const [id, stats] of estatisticasPorEscola) mapa.set(id, stats.total)
    return mapa
  }, [estatisticasPorEscola])

  const indicadoresPorEscola = useMemo(() => {
    const mapa = new Map<number, Indicador[]>()
    for (const e of escolas) mapa.set(e.id, calcularSelos(plantiosPorEscola.get(e.id) ?? []))
    return mapa
  }, [escolas, plantiosPorEscola])

  const escolaSelecionada = escolas.find((e) => e.id === escolaSelecionadaId) ?? null
  const statsSelecionada = escolaSelecionadaId
    ? estatisticasPorEscola.get(escolaSelecionadaId) ?? { total: 0, fotos: [] }
    : null
  const plantiosDaEscolaSelecionada = escolaSelecionadaId ? plantiosPorEscola.get(escolaSelecionadaId) ?? [] : []
  const naoMapeadas = escolas.filter((e) => e.latitude == null || e.longitude == null).length

  return (
    <div className="grid-main">
      <div className="card">
        <h2 className="card-title">Mapa das escolas</h2>
        <div className="map-box">
          <MapaInterativo escolas={escolas} onSelecionarEscola={setEscolaSelecionadaId} />
        </div>

        <div className="legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#6ee7b7' }} />
            Participa do projeto
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ border: '1.5px solid #e4e4e7' }} />
            Fora do projeto
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ border: '1.5px dashed #e4e4e7' }} />
            Localização aproximada
          </span>
        </div>
        <p className="caption">
          Toque em uma escola no mapa para ver estatísticas e fotos do plantio. Arraste e use o zoom para navegar
          pelo Grajaú — o mapa não sai da região da Diretoria Sul 3.
        </p>
        {naoMapeadas > 0 && (
          <p className="hint">
            {naoMapeadas} escola(s) ainda não têm endereço geocodificado e por isso só aparecem na lista.
          </p>
        )}
      </div>

      <div className="card">
        <h2 className="card-title" style={{ marginBottom: 4 }}>
          Lista de escolas
        </h2>
        <div className="card-subtitle">Sistema de progressão · passaporte de conquistas</div>
        <ListaEscolas
          escolas={escolas}
          totalPorEscola={totalPorEscola}
          indicadoresPorEscola={indicadoresPorEscola}
          escolaSelecionadaId={escolaSelecionadaId}
          onSelecionarEscola={setEscolaSelecionadaId}
        />
      </div>

      {escolaSelecionada && statsSelecionada && (
        <EscolaModal
          escolaId={escolaSelecionada.id}
          nomeEscola={escolaSelecionada.nome}
          participante={escolaSelecionada.participante}
          autenticado={autenticado}
          totalPlantado={statsSelecionada.total}
          fotos={statsSelecionada.fotos}
          plantiosDaEscola={plantiosDaEscolaSelecionada}
          onFechar={() => setEscolaSelecionadaId(null)}
        />
      )}
    </div>
  )
}
