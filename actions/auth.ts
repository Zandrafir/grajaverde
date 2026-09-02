'use server'

import { revalidatePath } from 'next/cache'
import { senhaConfere, definirCookieSessao, limparCookieSessao } from '@/lib/auth'

export type EstadoLogin = { erro: boolean }

export async function entrar(_estadoAnterior: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const senha = String(formData.get('senha') ?? '')
  if (!senhaConfere(senha)) {
    return { erro: true }
  }
  await definirCookieSessao()
  revalidatePath('/')
  return { erro: false }
}

export async function sair() {
  await limparCookieSessao()
  revalidatePath('/')
}
