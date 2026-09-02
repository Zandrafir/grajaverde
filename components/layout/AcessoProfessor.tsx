'use client'

// Widget compacto de acesso docente: alterna entre um formulario de
// senha (lib/auth.ts) e um indicativo de sessao ativa com botao de
// sair. Enquanto autenticado, a pagina (Server Component) libera o
// botao "Marcar participação" no mapa/lista e o formulário de registro
// de plantio dentro do EscolaModal.

import { useActionState } from 'react'
import { entrar, sair, type EstadoLogin } from '@/actions/auth'

const ESTADO_INICIAL: EstadoLogin = { erro: false }

export function AcessoProfessor({ autenticado }: { autenticado: boolean }) {
  const [estado, formAction, pendente] = useActionState(entrar, ESTADO_INICIAL)

  if (autenticado) {
    return (
      <form action={sair} className="flex items-center gap-3">
        <span className="pill">Acesso docente ativo</span>
        <button type="submit" className="link-muted">
          Sair
        </button>
      </form>
    )
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="senha-professor">
        Senha docente
      </label>
      <input
        id="senha-professor"
        name="senha"
        type="password"
        required
        placeholder="Senha docente"
        autoComplete="current-password"
        className="field-input"
        style={{ width: 160, padding: '6px 12px', fontSize: 13 }}
      />
      <button type="submit" disabled={pendente} className="btn-primary" style={{ padding: '6px 16px', fontSize: 13 }}>
        {pendente ? 'Entrando...' : 'Entrar'}
      </button>
      {estado.erro && (
        <span className="form-error" style={{ fontSize: 13 }}>
          Senha incorreta.
        </span>
      )}
    </form>
  )
}
