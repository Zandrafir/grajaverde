// Porta fiel da lista de categorias do artefato original (CATEGORIES /
// CAT_SLUGS em movimento-clima-grajau.html) - mesma ordem, mesmos slugs,
// para casar com os slugs ja gravados no seed (prisma/seed.ts) e no
// schema (model Categoria).
export const CATEGORIAS = [
  { slug: 'amazonicas', nome: 'Plantas Amazônicas' },
  { slug: 'mata-atlantica', nome: 'Mata Atlântica' },
  { slug: 'frutiferas', nome: 'Frutíferas' },
  { slug: 'cerrado', nome: 'Nativas do Cerrado' },
  { slug: 'ornamentais', nome: 'Ornamentais' },
] as const

export type CategoriaSlug = (typeof CATEGORIAS)[number]['slug']

// Gradiente por categoria (redesign GrajaVerde) - par de tokens
// --cat-<slug>-from/-to definido em app/globals.css, unica fonte de
// verdade para o grafico de categorias, os pinos do mapa por categoria
// e as etiquetas do catalogo de plantios.
export function corCategoria(slug: string): string {
  return `linear-gradient(90deg, var(--cat-${slug}-from), var(--cat-${slug}-to))`
}
