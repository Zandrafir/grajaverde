'use client'

import { useRef, useState, useTransition } from 'react'
import { criarPlantio } from '@/actions/plantios'
import { CATEGORIAS } from '@/lib/categorias'
import { validarUrlFoto } from '@/lib/validacao'

// Formulario de registro de plantio. Consome diretamente a Server Action
// `criarPlantio` (actions/plantios.ts) - sem endpoint intermediario. A
// action ja chama `revalidatePath('/')` ao gravar com sucesso; como a
// chamada roda dentro de um `startTransition` disparado pela submissao
// do formulario (o padrao de Server Actions do App Router), o
// Server Component da pagina (app/page.tsx) refaz o fetch e a tela
// atualiza sozinha, sem reload manual nem `router.refresh()` explicito.
//
// Eixo 3 (obrigatorio): "Disciplina Envolvida" e "Nome do Projeto/Eletiva".
// Eixo 5: URL da foto (Google Drive/Photos), validada tambem no cliente
// com a mesma regra do servidor (lib/validacao.ts), para dar feedback
// imediato antes de bater no backend.

const DISCIPLINAS = [
  'Ciências',
  'Biologia',
  'Geografia',
  'Humanidades',
  'Linguagens',
  'Matemática',
  'Projeto de Vida',
  'Outra',
]

type Props = {
  escolaId: number
}

export function FormularioPlantio({ escolaId }: Props) {
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set([CATEGORIAS[0].slug]))
  const [fotoUrl, setFotoUrl] = useState('')
  const [pending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const formRef = useRef<HTMLFormElement | null>(null)

  function alternarCategoria(slug: string) {
    setSelecionadas((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(slug)) {
        if (proximo.size === 1) return proximo // mantem ao menos 1 selecionada
        proximo.delete(slug)
      } else {
        proximo.add(slug)
      }
      return proximo
    })
  }

  function onSubmit(formData: FormData) {
    setErro(null)
    setSucesso(false)

    const quantidade = Number(formData.get('quantidade'))
    const urlFoto = fotoUrl.trim()

    if (urlFoto && !validarUrlFoto(urlFoto)) {
      setErro('url_foto_invalida')
      return
    }

    startTransition(async () => {
      const resultado = await criarPlantio({
        escolaId,
        quantidade,
        especie: String(formData.get('especie') ?? ''),
        categoriaSlugs: Array.from(selecionadas),
        disciplinaEnvolvida: String(formData.get('disciplina') ?? ''),
        nomeProjeto: String(formData.get('projeto') ?? ''),
        fotoUrls: urlFoto ? [urlFoto] : [],
      })

      if (!resultado.ok) {
        setErro(resultado.error)
        return
      }

      setSucesso(true)
      setFotoUrl('')
      setSelecionadas(new Set([CATEGORIAS[0].slug]))
      formRef.current?.reset()
    })
  }

  return (
    <form ref={formRef} action={onSubmit} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <span className="field-label">Categorias de planta</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => alternarCategoria(c.slug)}
              aria-pressed={selecionadas.has(c.slug)}
              className={`chip${selecionadas.has(c.slug) ? ' selected' : ''}`}
            >
              {c.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="field-label">Quantidade de mudas</span>
          <input name="quantidade" type="number" min={1} required className="field-input" />
        </label>

        <label className="block text-sm">
          <span className="field-label">Espécie (opcional)</span>
          <input name="especie" type="text" className="field-input" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="field-label">Disciplina envolvida</span>
          <select name="disciplina" defaultValue="" required className="field-select">
            <option value="" disabled>
              Selecione a disciplina
            </option>
            {DISCIPLINAS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="field-label">Nome do projeto/eletiva</span>
          <input name="projeto" type="text" placeholder="Ex: Clube do Verde" className="field-input" />
        </label>
      </div>

      <label className="block text-sm">
        <span className="field-label">URL da foto do plantio (opcional)</span>
        <input
          type="url"
          value={fotoUrl}
          onChange={(e) => setFotoUrl(e.target.value)}
          placeholder="https://drive.google.com/..."
          className="field-input"
        />
        <span className="mt-1 block text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Aceita apenas links do Google Drive ou Google Photos.
        </span>
      </label>

      {erro === 'url_foto_invalida' && (
        <p className="form-error">O link da foto precisa ser um endereço https do Google Drive ou Google Photos.</p>
      )}
      {erro === 'sem_categoria' && <p className="form-error">Selecione ao menos uma categoria de planta.</p>}
      {erro === 'quantidade_invalida' && <p className="form-error">Informe uma quantidade válida de mudas.</p>}
      {(erro === 'nao_autenticado' || erro === 'escola_nao_encontrada') && (
        <p className="form-error">Não foi possível confirmar a permissão de edição. Entre novamente com a senha docente.</p>
      )}
      {sucesso && <p className="form-success">Plantio registrado com sucesso.</p>}

      <button type="submit" disabled={pending} className="btn-primary" style={{ alignSelf: 'flex-start' }}>
        {pending ? 'Salvando...' : 'Registrar plantio'}
      </button>
    </form>
  )
}
