import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { estaAutenticado } from '@/lib/auth'
import { AcessoProfessor } from '@/components/layout/AcessoProfessor'
import { Carrossel } from '@/components/carrossel/Carrossel'
import { listarCarrossel } from '@/actions/carrossel'
import { PainelEscolas } from '@/components/escolas/PainelEscolas'
import { GraficoMensal } from '@/components/graficos/GraficoMensal'
import { GraficoCategoria } from '@/components/graficos/GraficoCategoria'
import { Catalogo } from '@/components/plantios/Catalogo'
import { evolucaoMensal, totalPorCategoria, type PlantioComCategorias } from '@/lib/agregacoes'

type EscolaRow = {
  id: number
  nome: string
  participante: boolean
  latitude: number | null
  longitude: number | null
  aproximado: boolean
}

type PlantioRow = PlantioComCategorias & {
  escolaId: number
  escola: { nome: string }
  especie: string | null
  disciplinaEnvolvida: string | null
  nomeProjeto: string | null
  fotos: { id: number; url: string }[]
}

// Server Component: roda no servidor a cada requisicao, busca os dados
// direto do Neon via Prisma e ja entrega o HTML com tudo preenchido.
// Os componentes de mapa/lista/graficos abaixo sao Client Components,
// mas recebem os dados como props - eles nunca fazem fetch proprio,
// entao nao existe o instante "vazio -> carregado" ao hidratar no
// navegador.
//
// Fallback de seguranca: se a consulta ao banco falhar (ex: Neon fora do
// ar), a pagina cai para os arrays vazios abaixo em vez de quebrar.
export default async function Home() {
  let escolas: EscolaRow[] = []
  let plantios: PlantioRow[] = []
  let itensCarrossel: Awaited<ReturnType<typeof listarCarrossel>> = []

  try {
    ;[escolas, plantios, itensCarrossel] = await Promise.all([
      // select explicito: nunca mandar `tokenEdicao` (nem `cep`/`endereco`,
      // sem uso na tela publica) para o client - o objeto inteiro retornado
      // aqui e serializado para o navegador de qualquer visitante ao ser
      // passado como prop para PainelEscolas (Client Component).
      prisma.escola.findMany({
        select: {
          id: true,
          nome: true,
          participante: true,
          latitude: true,
          longitude: true,
          aproximado: true,
        },
        orderBy: { nome: 'asc' },
      }),
      prisma.plantio.findMany({
        include: {
          categorias: { include: { categoria: true } },
          fotos: true,
          escola: { select: { nome: true } },
        },
        orderBy: { dataRegistro: 'desc' },
      }),
      listarCarrossel(),
    ])
  } catch (erro) {
    console.error('Falha ao carregar dados do Neon, exibindo estado vazio:', erro)
  }

  const autenticado = await estaAutenticado()
  const totaisPorCategoria = totalPorCategoria(plantios)
  const evolucao = evolucaoMensal(plantios)
  const totalMudas = plantios.reduce((acc, p) => acc + p.quantidade, 0)
  const escolasParticipantes = escolas.filter((e) => e.participante).length

  return (
    <div className="page">
      <div className="blob blob-1" aria-hidden="true" />
      <div className="blob blob-2" aria-hidden="true" />
      <div className="blob blob-3" aria-hidden="true" />

      <div className="content">
        <div className="topbar">
          <span className="breadcrumb">Movimento Pelo Clima · Diretoria Sul 3</span>
          <div className="topbar-actions">
            <AcessoProfessor autenticado={autenticado} />
          </div>
        </div>

        <div className="hero">
          <Image
            src="/images/hero-plantio.jpg"
            alt="Estudantes do Grajaú plantando mudas nativas no pátio da escola"
            fill
            priority
            className="hero-img"
            sizes="100vw"
          />
          <div className="hero-overlay" aria-hidden="true" />
          <div className="hero-content">
            <h1 className="title">GrajaVerde</h1>
            <p className="subtitle">
              Um catálogo vivo das árvores e plantas cultivadas pelas escolas estaduais do Grajaú, para acompanhar,
              turma a turma, o que cada comunidade escolar está plantando.
            </p>

            <div className="metrics">
              <div className="metric-card">
                <span className="metric-value">{totalMudas}</span>
                <div className="metric-label">mudas plantadas</div>
              </div>
              <div className="metric-card">
                <span className="metric-value">
                  {escolasParticipantes}/{escolas.length}
                </span>
                <div className="metric-label">escolas participantes</div>
              </div>
              <div className="metric-card">
                <span className="metric-value">{plantios.length}</span>
                <div className="metric-label">registros</div>
              </div>
            </div>
          </div>
        </div>

        <div className="sobre-projeto">
          <div className="sobre-texto">
            <h2 className="card-title-sm">Sobre o projeto</h2>
            <p>
              O GrajaVerde acompanha o plantio de mudas nativas da Mata Atlântica nas 57 escolas estaduais do Grajaú,
              ligadas à Diretoria de Ensino Sul 3. Cada registro nasce em sala de aula — nas disciplinas de geografia,
              biologia e projetos de sustentabilidade — e vira um dado público, aberto para toda a comunidade escolar
              acompanhar o crescimento coletivo do projeto.
            </p>
          </div>
          <div className="sobre-galeria">
            <figure className="sobre-foto">
              <Image src="/images/viveiro.jpg" alt="Viveiro escolar com mudas nativas em sacos de plantio" fill sizes="(min-width: 768px) 33vw, 100vw" />
              <figcaption>Viveiro escolar</figcaption>
            </figure>
            <figure className="sobre-foto">
              <Image
                src="/images/professora-orientando.jpg"
                alt="Professora orientando estudantes durante o plantio"
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
              />
              <figcaption>Orientação em campo</figcaption>
            </figure>
            <figure className="sobre-foto">
              <Image src="/images/muda-macro.jpg" alt="Muda nativa recém-plantada" fill sizes="(min-width: 768px) 33vw, 100vw" />
              <figcaption>Muda nativa</figcaption>
            </figure>
          </div>
        </div>

        <Carrossel itens={itensCarrossel} autenticado={autenticado} />

        <PainelEscolas escolas={escolas} plantios={plantios} autenticado={autenticado} />

        <div className="charts-grid">
          <div className="card">
            <h2 className="card-title-sm">Evolução dos plantios</h2>
            <div className="card-subtitle">Evolução mensal desde 2026</div>
            <GraficoMensal dados={evolucao} />
          </div>
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 20 }}>
              Por categoria de planta
            </h2>
            <GraficoCategoria dados={totaisPorCategoria} />
          </div>
        </div>

        <div className="card" style={{ marginTop: 32 }}>
          <div className="catalog-header">
            <h2 className="card-title" style={{ margin: 0 }}>
              Catálogo de plantios
            </h2>
            <a href="/api/export" className="link-accent">
              Exportar CSV
            </a>
          </div>
          <p className="catalog-subtitle">Registros mais recentes primeiro.</p>
          <Catalogo plantios={plantios} />
        </div>

        <p className="footer-note">GrajaVerde — Movimento Pelo Clima. Diretoria de Ensino Sul 3.</p>
      </div>
    </div>
  )
}
