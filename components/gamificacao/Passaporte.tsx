'use client'

// Eixo 2: indicadores de engajamento por escola, calculados no client a
// partir dos plantios ja carregados via prop (ver
// lib/agregacoes.ts:calcularSelos) - sem tabela propria no banco. Versao
// detalhada (criterio por extenso + barra de progresso numerica), usada
// dentro do EscolaModal; a versao compacta (so os selos circulares)
// aparece direto nos cards da lista - ver components/escolas/ListaEscolas.tsx.
//
// Diretriz de linguagem (obrigatoria): tom direto, formal, adequado ao
// ensino medio. Sem metaforas de jogo, RPG ou fantasia - cada indicador
// exibe o criterio objetivo e o progresso numerico, nao uma "conquista"
// misteriosa a ser desbloqueada. Essa exigencia se mantem mesmo com o
// redesign visual GrajaVerde: so o estilo dos selos (circulo com glow)
// veio da referencia, os nomes/criterios sao os definidos com o professor.

import Image from 'next/image'
import { calcularSelos, type PlantioComCategorias } from '@/lib/agregacoes'

export function Passaporte({ plantiosDaEscola }: { plantiosDaEscola: PlantioComCategorias[] }) {
  const indicadores = calcularSelos(plantiosDaEscola)

  return (
    <div>
      <h3 className="text-sm font-semibold text-white">Indicadores de engajamento</h3>
      <div className="mt-2 flex flex-col gap-2">
        {indicadores.map((ind) => (
          <div key={ind.id} className={`indicador-card${ind.atingido ? ' atingido' : ''}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Image
                  src={ind.imagem}
                  alt=""
                  width={40}
                  height={40}
                  className={`indicador-selo${ind.atingido ? '' : ' indicador-selo-inativo'}`}
                />
                <span className="font-semibold text-white">{ind.titulo}</span>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{
                  background: ind.atingido ? 'linear-gradient(135deg,#a3e635,#10b981)' : 'transparent',
                  color: ind.atingido ? '#052e16' : 'var(--text-tertiary)',
                }}
              >
                {ind.atingido ? 'Atingido' : `${ind.progresso}/${ind.meta}`}
              </span>
            </div>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
              {ind.criterio}
            </p>
            <div className="indicador-track">
              <div className="indicador-fill" style={{ width: `${(ind.progresso / ind.meta) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
