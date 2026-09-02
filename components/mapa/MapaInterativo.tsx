'use client'

// Ponto de entrada do mapa: apenas carrega MapaLeaflet.tsx via
// next/dynamic com `ssr:false`. O pacote `leaflet` toca em `window` no
// momento em que o modulo e avaliado, entao ele nao pode ser importado
// em um caminho que o Next tente renderizar no servidor - `ssr:false`
// garante que o componente real so e montado no navegador, depois da
// hidratacao (por isso o `loading` abaixo: e o que aparece por um
// instante enquanto o bundle do Leaflet carrega).
//
// Preenche 100% do `.map-box` do card pai (PainelEscolas.tsx) - a
// prop `onSelecionarEscola` e repassada sem alteracao para o
// MapaLeaflet, quem decide o que acontece com a selecao (abrir o
// EscolaModal) continua sendo o componente pai.

import dynamic from 'next/dynamic'

type EscolaRow = {
  id: number
  nome: string
  participante: boolean
  latitude: number | null
  longitude: number | null
  aproximado: boolean
}

type Props = {
  escolas: EscolaRow[]
  onSelecionarEscola: (id: number) => void
}

const MapaLeaflet = dynamic(() => import('./MapaLeaflet').then((mod) => mod.MapaLeaflet), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-[color:var(--text-tertiary)]">
      Carregando mapa...
    </div>
  ),
})

export function MapaInterativo({ escolas, onSelecionarEscola }: Props) {
  return <MapaLeaflet escolas={escolas} onSelecionarEscola={onSelecionarEscola} />
}
