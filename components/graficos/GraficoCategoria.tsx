'use client'

// Totais por categoria de planta - barras horizontais com gradiente por
// categoria (lib/categorias.ts:corCategoria, tokens em app/globals.css).
// As 5 categorias aparecem sempre, mesmo zeradas, ordenadas da maior
// para a menor - igual ao artefato original.

import { corCategoria } from '@/lib/categorias'

type Item = { slug: string; nome: string; quantidade: number }

export function GraficoCategoria({ dados }: { dados: Item[] }) {
  const max = Math.max(1, ...dados.map((d) => d.quantidade))

  return (
    <div className="category-list">
      {dados.map((d) => {
        const pct = max > 0 ? (d.quantidade / max) * 100 : 0
        return (
          <div key={d.slug} className="category-row">
            <span className="category-name">{d.nome}</span>
            <span className="category-track">
              <span className="category-fill" style={{ width: `${pct}%`, background: corCategoria(d.slug) }} />
            </span>
            <span className="category-value">{d.quantidade}</span>
          </div>
        )
      })}
    </div>
  )
}
