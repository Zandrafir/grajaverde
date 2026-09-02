// Dominios aceitos para URLs de foto no portfolio (Eixo 5).
// Mantem o campo restrito a links de imagem hospedados no Google Drive/
// Google Photos, evitando que o formulario vire um vetor para links
// arbitrarios exibidos no site.
const DOMINIOS_PERMITIDOS = [
  'drive.google.com',
  'lh3.googleusercontent.com',
  'photos.google.com',
]

export function validarUrlFoto(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    return DOMINIOS_PERMITIDOS.some(
      (dominio) => parsed.hostname === dominio || parsed.hostname.endsWith(`.${dominio}`)
    )
  } catch {
    return false
  }
}

// Sanitizacao basica de texto livre vindo de formularios (nome de
// disciplina, projeto, especie) antes de gravar no banco.
export function sanitizarTexto(valor: string, maxLength = 200): string {
  return valor.trim().slice(0, maxLength)
}
