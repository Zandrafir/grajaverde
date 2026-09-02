'use client'

// Mapa interativo real (Leaflet + CartoDB Dark Matter), substituindo o
// SVG desenhado a mao. So e importado via next/dynamic com `ssr:false`
// em MapaInterativo.tsx - o pacote `leaflet` acessa `window` assim que e
// carregado, o que quebra a renderizacao no servidor (Server Components/
// SSR do App Router) se importado diretamente em um componente que o
// Next tenta renderizar no servidor.
//
// Preenche 100% do `.map-box` do card pai (PainelEscolas.tsx, que
// tambem renderiza legenda/legenda/caption fora deste componente,
// seguindo a estrutura do redesign GrajaVerde) - nao tem wrapper,
// legenda nem altura propria.
//
// Icones: em vez do marcador padrao do Leaflet (que exige apontar para
// os arquivos de imagem do pacote, um problema classico de bundling),
// usamos `L.divIcon` com um pino simples em SVG - verde/lima para
// participante, contorno claro (solido = fora do projeto, tracejado =
// localizacao aproximada) para as demais, igual a legenda do redesign.

import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import L, { type LatLngBoundsExpression } from 'leaflet'

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

function shortName(nome: string) {
  const n = nome.replace(/^EE\s+/, '')
  return n.length > 22 ? n.slice(0, 20) + '…' : n
}

function criarIcone(participante: boolean, aproximado: boolean) {
  const cor = participante ? '#6ee7b7' : 'transparent'
  const contorno = participante ? '#052e16' : '#e4e4e7'
  const dash = !participante && aproximado ? 'stroke-dasharray="3 2.5"' : ''
  const html = `
    <svg width="22" height="28" viewBox="0 0 22 28" xmlns="http://www.w3.org/2000/svg">
      <path d="M11,26.5 C11,26.5 3.5,16.5 3.5,10.5 C3.5,5.8 6.9,2.5 11,2.5 C15.1,2.5 18.5,5.8 18.5,10.5 C18.5,16.5 11,26.5 11,26.5 Z"
            fill="${cor}" stroke="${contorno}" stroke-width="1.6" ${dash} />
      <circle cx="11" cy="10.5" r="3.2" fill="${participante ? '#052e16' : '#e4e4e7'}" />
    </svg>
  `
  return L.divIcon({
    html,
    className: 'escola-pin',
    iconSize: [22, 28],
    iconAnchor: [11, 27],
    tooltipAnchor: [0, -26],
  })
}

// Reenquadra o mapa quando o conjunto de escolas mapeaveis muda (ex: uma
// escola recem-geocodificada) - o MapContainer so aceita `bounds` na
// montagem inicial, entao ajustes depois disso passam por este hook.
function AjustarEnquadramento({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [24, 24] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(bounds)])
  return null
}

export function MapaLeaflet({ escolas, onSelecionarEscola }: Props) {
  const mapeadas = escolas.filter(
    (s): s is EscolaRow & { latitude: number; longitude: number } =>
      typeof s.latitude === 'number' && typeof s.longitude === 'number'
  )

  if (!mapeadas.length) {
    return (
      <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-[color:var(--text-tertiary)]">
        Nenhuma escola com localização cadastrada ainda.
      </div>
    )
  }

  type Retangulo = [[number, number], [number, number]]

  const bounds: Retangulo = [
    [Math.min(...mapeadas.map((s) => s.latitude)) - 0.01, Math.min(...mapeadas.map((s) => s.longitude)) - 0.01],
    [Math.max(...mapeadas.map((s) => s.latitude)) + 0.01, Math.max(...mapeadas.map((s) => s.longitude)) + 0.01],
  ]

  // maxBounds fica sempre um pouco mais largo que o enquadramento das
  // escolas, para nao travar o arrasto bem em cima dos pinos da borda.
  const maxBounds: LatLngBoundsExpression = [
    [bounds[0][0] - 0.04, bounds[0][1] - 0.04],
    [bounds[1][0] + 0.04, bounds[1][1] + 0.04],
  ]

  const centro: [number, number] = [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2]

  return (
    <MapContainer
      center={centro}
      zoom={13}
      minZoom={11}
      maxBounds={maxBounds}
      maxBoundsViscosity={1.0}
      bounds={bounds}
      style={{ height: '100%', width: '100%' }}
    >
      {/* Basemap gratuito CartoDB Dark Matter - a CARTO passou a exigir
          uma chave de API tambem para os basemaps raster gratuitos (ate
          5 milhoes de requisicoes/mes, sem custo, sem precisar de conta
          na CARTO - so um email). A chave e publica por natureza (vai
          na URL que o navegador de qualquer visitante busca), entao usa
          NEXT_PUBLIC_ de proposito - nao e um segredo como
          DATABASE_URL/ADMIN_PASSWORD. Sem a variavel configurada, o
          mapa mostra o selo "API KEY REQUIRED" da CARTO em vez das
          ruas. */}
      <TileLayer
        url={`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${
          process.env.NEXT_PUBLIC_CARTO_API_KEY ? `?key=${process.env.NEXT_PUBLIC_CARTO_API_KEY}` : ''
        }`}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      <AjustarEnquadramento bounds={bounds} />

      {mapeadas.map((s) => (
        <Marker
          key={s.id}
          position={[s.latitude, s.longitude]}
          icon={criarIcone(s.participante, s.aproximado)}
          eventHandlers={{ click: () => onSelecionarEscola(s.id) }}
        >
          {s.participante && (
            <Tooltip permanent direction="top" offset={[0, -24]} className="escola-tooltip">
              {shortName(s.nome)}
            </Tooltip>
          )}
          <Tooltip direction="top" offset={[0, -24]} sticky>
            {s.nome}
            {s.aproximado ? ' (localização aproximada)' : ''}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  )
}
