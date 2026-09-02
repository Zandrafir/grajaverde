import { cookies } from 'next/headers'
import crypto from 'node:crypto'

// Autenticacao minima para o corpo docente (MVP): uma unica senha
// compartilhada (ADMIN_PASSWORD no .env) desbloqueia as acoes de escrita
// (marcar participacao, registrar plantio) para quem a digitar - sem
// cadastro de usuario individual.
//
// Por que nao o tokenEdicao por escola (ja existe em prisma/schema.prisma):
// aquele modelo exige uma rota autenticada por escola
// (ex: /escola/[id]?token=...) que ainda nao foi construida, e o token
// teria que ser distribuido manualmente para as 57 escolas antes de
// qualquer uso. Este MVP prioriza algo que a Diretoria consegue usar
// amanha; o campo tokenEdicao permanece no banco, pronto para uma
// evolucao futura com identidade por escola (ex: NextAuth) sem exigir
// nova migração nem trocar este arquivo inteiro.
//
// Seguranca: cada Server Action que escreve dados (actions/escolas.ts,
// actions/plantios.ts) SEMPRE rechama `estaAutenticado()` no servidor
// antes de gravar - nunca confia apenas em o que foi renderizado no
// client. O cookie e httpOnly (invisivel a JS no navegador) e guarda o
// hash da senha, nunca a senha em texto puro.

const NOME_COOKIE = 'vg_sessao'

function hash(valor: string): string {
  return crypto.createHash('sha256').update(valor).digest('hex')
}

function segredoEsperado(): string | null {
  const senha = process.env.ADMIN_PASSWORD
  if (!senha) return null
  return hash(senha)
}

function comparacaoSegura(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)
}

export function senhaConfere(tentativa: string): boolean {
  const esperado = segredoEsperado()
  if (!esperado || !tentativa) return false
  return comparacaoSegura(hash(tentativa), esperado)
}

export async function estaAutenticado(): Promise<boolean> {
  const esperado = segredoEsperado()
  if (!esperado) return false
  const store = await cookies()
  const valor = store.get(NOME_COOKIE)?.value
  if (!valor) return false
  return comparacaoSegura(valor, esperado)
}

export async function definirCookieSessao() {
  const esperado = segredoEsperado()
  if (!esperado) return
  const store = await cookies()
  store.set(NOME_COOKIE, esperado, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  })
}

export async function limparCookieSessao() {
  const store = await cookies()
  store.delete(NOME_COOKIE)
}
