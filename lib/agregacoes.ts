// Funcoes puras de agregacao sobre os dados ja carregados no client -
// usadas pelos graficos e pelo modulo de gamificacao (Eixo 2). Portadas
// fielmente de monthlySeries()/categoryTotals() no artefato original
// (movimento-clima-grajau.html), trocando `state.entries` (array local)
// pelos `Plantio[]` vindos do Prisma via props.

import { CATEGORIAS } from './categorias'

export type PlantioComCategorias = {
  id: number
  escolaId: number
  quantidade: number
  dataRegistro: string | Date
  categorias: { categoria: { slug: string; nome: string } }[]
  disciplinaEnvolvida?: string | null
}

const NOMES_MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function chaveDoMes(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
}

function rotuloDoMes(chave: string) {
  const [ano, mes] = chave.split('-')
  return `${NOMES_MES[Number(mes) - 1]}/${ano.slice(2)}`
}

// Serie mensal continua de Janeiro/2026 ate o mes corrente (ou ate o mes
// do plantio mais recente, se for posterior a hoje) - meses sem plantio
// aparecem com total 0, igual ao artefato original, para o grafico nunca
// "pular" um mes no eixo X.
export function evolucaoMensal(plantios: PlantioComCategorias[]) {
  const agora = new Date()
  let anoFim = agora.getFullYear()
  let mesFim = agora.getMonth() + 1
  const anoInicio = 2026
  const mesInicio = 1

  for (const p of plantios) {
    const d = new Date(p.dataRegistro)
    const ano = d.getFullYear()
    const mes = d.getMonth() + 1
    if (ano > anoFim || (ano === anoFim && mes > mesFim)) {
      anoFim = ano
      mesFim = mes
    }
  }
  if (anoFim < anoInicio) {
    anoFim = anoInicio
    mesFim = mesInicio
  }

  const meses: string[] = []
  let ano = anoInicio
  let mes = mesInicio
  while (ano < anoFim || (ano === anoFim && mes <= mesFim)) {
    meses.push(`${ano}-${String(mes).padStart(2, '0')}`)
    mes++
    if (mes > 12) {
      mes = 1
      ano++
    }
  }

  const totais = new Map(meses.map((k) => [k, 0]))
  for (const p of plantios) {
    const chave = chaveDoMes(new Date(p.dataRegistro))
    if (totais.has(chave)) {
      totais.set(chave, (totais.get(chave) ?? 0) + p.quantidade)
    }
  }

  return meses.map((chave) => ({
    mes: chave,
    label: rotuloDoMes(chave),
    quantidade: totais.get(chave) ?? 0,
  }))
}

// Totais por categoria, nas 5 categorias fixas (mesmo quando zeradas),
// ordenados do maior para o menor - igual a categoryTotals() original.
export function totalPorCategoria(plantios: PlantioComCategorias[]) {
  const totais = new Map<string, number>(CATEGORIAS.map((c) => [c.slug, 0]))
  for (const p of plantios) {
    for (const pc of p.categorias) {
      if (totais.has(pc.categoria.slug)) {
        totais.set(pc.categoria.slug, (totais.get(pc.categoria.slug) ?? 0) + p.quantidade)
      }
    }
  }
  return CATEGORIAS.map((c) => ({ slug: c.slug, nome: c.nome, quantidade: totais.get(c.slug) ?? 0 })).sort(
    (a, b) => b.quantidade - a.quantidade
  )
}

// Indicadores de progresso do Eixo 2 ("Passaporte de Conquistas"), por
// escola, a partir dos plantios ja carregados. Linguagem deliberadamente
// direta e formal - sem termos de jogo/RPG - por serem exibidos em
// ambiente de ensino medio: cada indicador nomeia a meta objetiva que o
// origina, sem misterio nem recompensa simbolica.
export type Indicador = {
  id: string
  titulo: string
  criterio: string
  progresso: number
  meta: number
  atingido: boolean
  // Selo ilustrado (gerado com o professor) exibido no Passaporte e na
  // lista de escolas - fica esmaecido em cinza via CSS ate ser atingido.
  imagem: string
}

export function calcularSelos(plantiosDaEscola: PlantioComCategorias[]): Indicador[] {
  const totalNativas = plantiosDaEscola
    .filter((p) => p.categorias.some((c) => c.categoria.slug === 'mata-atlantica'))
    .reduce((acc, p) => acc + p.quantidade, 0)

  const categoriasDistintas = new Set(
    plantiosDaEscola.flatMap((p) => p.categorias.map((c) => c.categoria.slug))
  ).size

  const totalRegistros = plantiosDaEscola.length

  const mesesDistintos = new Set(plantiosDaEscola.map((p) => chaveDoMes(new Date(p.dataRegistro)))).size

  const disciplinasDistintas = new Set(
    plantiosDaEscola.map((p) => p.disciplinaEnvolvida).filter((d): d is string => Boolean(d && d.trim()))
  ).size

  const METAS = {
    mudasNativas: 10,
    categoriasDistintas: 5,
    registros: 10,
    meses: 3,
    disciplinas: 3,
  }

  return [
    {
      id: 'guardiao-mata-atlantica',
      titulo: 'Guardião da Mata Atlântica',
      criterio: `Registro de ${METAS.mudasNativas} ou mais mudas nativas da Mata Atlântica`,
      progresso: Math.min(totalNativas, METAS.mudasNativas),
      meta: METAS.mudasNativas,
      atingido: totalNativas >= METAS.mudasNativas,
      imagem: '/images/selo-guardiao-mata-atlantica.png',
    },
    {
      id: 'diversidade-botanica',
      titulo: 'Diversidade Botânica',
      criterio: `Registro de plantio em ${METAS.categoriasDistintas} categorias de planta diferentes`,
      progresso: Math.min(categoriasDistintas, METAS.categoriasDistintas),
      meta: METAS.categoriasDistintas,
      atingido: categoriasDistintas >= METAS.categoriasDistintas,
      imagem: '/images/selo-diversidade-botanica.png',
    },
    {
      id: 'mobilizacao-coletiva',
      titulo: 'Mobilização Coletiva',
      criterio: `Registro de ${METAS.registros} ou mais plantios realizados pela escola`,
      progresso: Math.min(totalRegistros, METAS.registros),
      meta: METAS.registros,
      atingido: totalRegistros >= METAS.registros,
      imagem: '/images/selo-mobilizacao-coletiva.png',
    },
    {
      id: 'constancia-cuidado',
      titulo: 'Constância no Cuidado',
      criterio: `Registro de plantio em ${METAS.meses} ou mais meses diferentes`,
      progresso: Math.min(mesesDistintos, METAS.meses),
      meta: METAS.meses,
      atingido: mesesDistintos >= METAS.meses,
      imagem: '/images/selo-constancia-cuidado.png',
    },
    {
      id: 'educacao-ambiental',
      titulo: 'Educação Ambiental',
      criterio: `Registro de plantio envolvendo ${METAS.disciplinas} ou mais disciplinas diferentes`,
      progresso: Math.min(disciplinasDistintas, METAS.disciplinas),
      meta: METAS.disciplinas,
      atingido: disciplinasDistintas >= METAS.disciplinas,
      imagem: '/images/selo-educacao-ambiental.png',
    },
  ]
}
