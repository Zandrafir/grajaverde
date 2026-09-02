// Catalogo de plantios (Server Component - renderiza a lista recebida
// via prop, sem interatividade propria). Porta do "Catálogo de
// plantios" do artefato original (renderLedger()): registros mais
// recentes primeiro, com escola, data, quantidade, categorias e o
// contexto pedagogico (Eixo 3).

import { corCategoria } from '@/lib/categorias'
import type { PlantioComCategorias } from '@/lib/agregacoes'

type PlantioRow = PlantioComCategorias & {
  escola: { nome: string }
  especie: string | null
  disciplinaEnvolvida: string | null
  nomeProjeto: string | null
}

function formatarData(data: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(data)
  )
}

export function Catalogo({ plantios }: { plantios: PlantioRow[] }) {
  if (plantios.length === 0) {
    return (
      <p className="catalog-empty">
        Nenhum plantio registrado ainda. Os registros aparecem aqui assim que uma escola cadastrar o primeiro
        plantio.
      </p>
    )
  }

  return (
    <div className="catalog-list">
      {plantios.slice(0, 30).map((p) => (
        <div key={p.id} className="catalog-entry">
          <div>
            <div className="catalog-name">{p.escola.nome}</div>
            <div className="catalog-meta">
              {p.quantidade} muda(s){p.especie ? ` · ${p.especie}` : ''}
              {p.disciplinaEnvolvida ? ` · ${p.disciplinaEnvolvida}` : ''}
              {p.nomeProjeto ? ` · ${p.nomeProjeto}` : ''}
            </div>
            <div className="tags">
              {p.categorias.map((c) => (
                <span key={c.categoria.slug} className="tag" style={{ background: corCategoria(c.categoria.slug) }}>
                  {c.categoria.nome}
                </span>
              ))}
            </div>
          </div>
          <div className="catalog-date">{formatarData(p.dataRegistro)}</div>
        </div>
      ))}
      {plantios.length > 30 && (
        <p className="catalog-empty" style={{ textAlign: 'center' }}>
          Mostrando os 30 registros mais recentes de {plantios.length}. Exporte o CSV completo abaixo.
        </p>
      )}
    </div>
  )
}
