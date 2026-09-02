# Verde do Grajaú — Fase 2

Migração do artefato autocontido para uma plataforma Next.js + Neon.Tech,
conforme o plano de migração aprovado.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma 6 (fixado em versão estável — a instalação padrão trouxe uma
  release candidate 8.0.0-rc, revertida para 6.19.3)
- Neon.Tech (Postgres serverless, plano free)
- Hospedagem prevista: Vercel (plano free)

## Como rodar localmente

1. Crie um projeto no [Neon.Tech](https://neon.tech) (plano free).
2. Copie `.env.example` para `.env` e preencha `DATABASE_URL` (connection
   string **pooled**, host termina em `-pooler`) e `DIRECT_URL`
   (connection string **direta**, sem `-pooler`) — ambas no painel do
   Neon em *Connection Details*.
3. Instale as dependências (se ainda não instaladas):
   ```bash
   npm install
   ```
4. Gere o client do Prisma e crie as tabelas no Neon:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
5. Popule o banco com as 57 escolas do Grajaú (estado zerado, sem
   plantios, nenhuma marcada como participante):
   ```bash
   npm run db:seed
   ```
6. Rode o projeto:
   ```bash
   npm run dev
   ```

## O que já está pronto

- `prisma/schema.prisma` — schema completo (Escola, Categoria, Plantio,
  PlantioCategoria, FotoPlantio), com `directUrl` configurado para o
  padrão pooled/direct do Neon.
- `prisma/seed.ts` — as 57 escolas estaduais do Grajaú (Diretoria Sul 3),
  nomes atualizados, coordenadas geocodificadas, estado zerado.
- `app/page.tsx` — Server Component com o fetch inicial (mapa e gráficos
  nunca renderizam vazios esperando um fetch client-side; ver comentários
  no arquivo).
- `actions/escolas.ts`, `actions/plantios.ts` — Server Actions com
  verificação de `tokenEdicao` por escola (autenticação mínima; evoluir
  para NextAuth se a Diretoria exigir).
- `app/api/escolas`, `app/api/plantios`, `app/api/plantios/[id]` — rotas
  REST equivalentes, para consumidores externos.
- `app/api/export` — geração de CSV filtrável por período/categoria
  (Eixo 4).
- `lib/agregacoes.ts` — cálculo de gráficos e dos selos do "Passaporte de
  Conquistas" (Eixo 2), no client, sem tabela própria.
- `lib/validacao.ts` — validação de URLs de foto restrita a domínios do
  Google Drive/Photos (Eixo 5).
- Componentes em `components/mapa`, `components/graficos`,
  `components/formulario`, `components/gamificacao` — estrutura pronta
  com `TODO`s indicando onde portar o visual já validado no artefato
  original (`movimento-clima-grajau.html`).

## O que falta (próximos passos)

- Portar o SVG do mapa ilustrado e os gráficos animados do artefato
  original para dentro dos componentes React (hoje eles têm uma versão
  funcional simplificada, sem o visual final).
- Gerar os `tokenEdicao` reais por escola e distribuí-los às unidades
  (hoje o seed gera um UUID aleatório por escola via
  `@default(uuid())`).
- Decidir se a exportação (Eixo 4) roda via `/api/export` (já pronta) ou
  via Blob API no client, conforme a preferência de vocês.
- Rodar `npm audit fix` antes de ir para produção — a instalação trouxe
  algumas vulnerabilidades de dependências transitivas do Next.js/ESLint
  a serem revisadas.
