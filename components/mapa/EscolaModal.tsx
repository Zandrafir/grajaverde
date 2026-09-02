'use client'

// Modal de uma escola: metricas reais + portfolio visual (Eixo 5) +
// indicadores de engajamento (Eixo 2, Passaporte) + acoes de escrita
// (marcar participacao, registrar plantio) quando ha sessao docente
// ativa (lib/auth.ts). Aberto a partir de um clique no pino do mapa OU
// de um card na lista de escolas - ver components/escolas/PainelEscolas.tsx,
// que e o unico lugar que instancia este componente.

import { useTransition } from 'react'
import { Passaporte } from '@/components/gamificacao/Passaporte'
import { FormularioPlantio } from '@/components/formulario/FormularioPlantio'
import { alternarParticipacao } from '@/actions/escolas'
import type { PlantioComCategorias } from '@/lib/agregacoes'

type Foto = { id: number; url: string }

type Props = {
  escolaId: number
  nomeEscola: string
  participante: boolean
  autenticado: boolean
  totalPlantado: number
  fotos: Foto[]
  plantiosDaEscola: PlantioComCategorias[]
  onFechar: () => void
}

export function EscolaModal({
  escolaId,
  nomeEscola,
  participante,
  autenticado,
  totalPlantado,
  fotos,
  plantiosDaEscola,
  onFechar,
}: Props) {
  const [pendente, startTransition] = useTransition()

  function alternar() {
    startTransition(async () => {
      await alternarParticipacao(escolaId)
    })
  }

  return (
    <div className="modal-overlay" onClick={onFechar} role="presentation">
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={nomeEscola} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">{nomeEscola}</h2>
            {participante && <span className="participates-badge" style={{ marginTop: 6, display: 'inline-block' }}>Participa</span>}
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="modal-close">
            ×
          </button>
        </div>

        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {totalPlantado > 0
            ? `${totalPlantado} mudas plantadas registradas`
            : 'Nenhum plantio registrado ainda por esta escola.'}
        </p>

        {autenticado && (
          <button type="button" onClick={alternar} disabled={pendente} className="btn-ghost mt-3">
            {pendente ? 'Salvando...' : participante ? 'Desmarcar participação' : 'Marcar como participante'}
          </button>
        )}

        <div className="mt-4">
          <Passaporte plantiosDaEscola={plantiosDaEscola} />
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-white">Portfólio</h3>
          {fotos.length > 0 ? (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {fotos.map((f) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={f.id}
                  src={f.url}
                  alt={`Registro de plantio em ${nomeEscola}`}
                  className="aspect-square rounded-lg object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Nenhuma foto adicionada ainda. Fotos podem ser incluídas ao registrar um plantio (link do Google
              Drive/Photos).
            </p>
          )}
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-white">Registrar plantio</h3>
          {autenticado ? (
            <div className="mt-2">
              <FormularioPlantio escolaId={escolaId} />
            </div>
          ) : (
            <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Entre com a senha docente (canto superior da página) para registrar um plantio desta escola.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
