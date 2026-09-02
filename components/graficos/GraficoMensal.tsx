'use client'

// Evolucao mensal de plantios - barras verticais em HTML/CSS (redesign
// GrajaVerde), substituindo o SVG desenhado a mao. Nao faz fetch: recebe
// os dados ja agregados via prop (ver lib/agregacoes.ts:evolucaoMensal),
// que o Server Component (app/page.tsx) calcula a partir dos plantios
// vindos do Neon. A altura de cada barra e uma porcentagem do maior
// valor da serie (a barra do mes com mais plantios sempre bate 100%);
// o rotulo numerico so aparece acima de barras com valor > 0, igual ao
// arquivo de referencia do handoff.

type Ponto = { mes: string; label: string; quantidade: number }

export function GraficoMensal({ dados }: { dados: Ponto[] }) {
  const max = Math.max(1, ...dados.map((d) => d.quantidade))

  return (
    <div
      className="bar-chart"
      role="img"
      aria-label={`Evolução mensal de plantios: ${dados.map((d) => `${d.label} ${d.quantidade}`).join(', ')}`}
    >
      {dados.map((d) => {
        const pct = d.quantidade > 0 ? Math.max((d.quantidade / max) * 100, 2) : 1
        return (
          <div key={d.mes} className="bar-col">
            {d.quantidade > 0 && <span className="bar-value">{d.quantidade}</span>}
            <div className="bar" style={{ height: `${pct}%` }} />
            <span className="bar-label">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}
