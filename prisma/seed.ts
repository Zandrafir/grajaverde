import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// As 5 categorias de planta usadas no dashboard original (Verde do Grajau).
const CATEGORIAS = [
  { slug: 'mata-atlantica', nome: 'Mata Atlantica' },
  { slug: 'frutiferas', nome: 'Frutiferas' },
  { slug: 'cerrado', nome: 'Cerrado' },
  { slug: 'ornamentais', nome: 'Ornamentais' },
  { slug: 'amazonicas', nome: 'Amazonicas' },
]

// As 57 escolas estaduais do distrito do Grajau (Diretoria de Ensino Sul 3),
// nomes atualizados conforme a relacao oficial de 04/01/2026.
// Estado "zerado": nenhuma escola marcada como participante, sem plantios -
// para a base nascer identica ao estado de apresentacao do artefato atual.
const ESCOLAS = [
  { nome: 'EE Ada Pellegrini Grinover', endereco: 'Rua José Diogo Abadiano 195a', cep: '04855-440', latitude: -23.7736705, longitude: -46.6834376, aproximado: false, participante: false },
  { nome: 'EE Adelaide Rosa Fernandes Machado de Souza Profa', endereco: 'Av Dona Belmira Marin 3.312', cep: '04846-000', latitude: -23.7453974, longitude: -46.6898375, aproximado: true, participante: false },
  { nome: 'EE Adriao Bernardes Prof', endereco: 'Estrada de Itaquaquecetuba 9953', cep: '04872-060', latitude: -23.7919157, longitude: -46.6396018, aproximado: false, participante: false },
  { nome: 'EE Afranio de Oliveira', endereco: 'Rua Giuseppe Tartini 818', cep: '04844-300', latitude: -23.7542897, longitude: -46.7046704, aproximado: true, participante: false },
  { nome: 'EE Ana Maria Bento', endereco: 'Rua Min Mario David Andreazza 94', cep: '04849-080', latitude: -23.7422, longitude: -46.6725, aproximado: true, participante: false },
  { nome: 'EE Aniz Badra Dr', endereco: 'Rua Min Mário David Andreaza 112', cep: '04849-080', latitude: -23.7422, longitude: -46.6725, aproximado: true, participante: false },
  { nome: 'EE Antonio Candido de Mello e Souza Prof', endereco: 'Av São Paulo S/nº', cep: '04849-308', latitude: -23.7334467, longitude: -46.6598035, aproximado: false, participante: false },
  { nome: 'EE Argeo Pinto Dias Eng', endereco: 'Rua Falcao Peregrino 22', cep: '04857-350', latitude: -23.7829929, longitude: -46.6907004, aproximado: false, participante: false },
  { nome: 'EE Benedito Celio de Siqueira Prof', endereco: 'Av São Paulo 53', cep: '04891-070', latitude: -23.7318, longitude: -46.6612, aproximado: true, participante: false },
  { nome: 'EE Carlos Ayres Prof', endereco: 'Av Dona Belmira Marin 595', cep: '04846-010', latitude: -23.7362911, longitude: -46.6934813, aproximado: true, participante: false },
  { nome: 'EE Carlos de Moraes Andrade Prof', endereco: 'Av Dona Belmira Marin 2440', cep: '04846-000', latitude: -23.7453974, longitude: -46.6898375, aproximado: true, participante: false },
  { nome: 'EE Chacara das Corujas', endereco: '', cep: '', latitude: null, longitude: null, aproximado: false, participante: false },
  { nome: 'EE Christiano Altenfelder Silva Dr', endereco: 'Rua Julia Mameia 45', cep: '04859-100', latitude: -23.7647888, longitude: -46.703333, aproximado: false, participante: false },
  { nome: 'EE Clarina Amaral Gurgel Profa', endereco: 'Praça Irara Branca S/nº', cep: '', latitude: null, longitude: null, aproximado: false, participante: false },
  { nome: 'EE Claudirene Aparecida José da Silva Profa.', endereco: 'Rua José Diogo Abadiano S/nº', cep: '04855-440', latitude: -23.7736705, longitude: -46.6834376, aproximado: false, participante: false },
  { nome: 'EE Eloely Nery Nambum Diretora', endereco: 'Av Carlos Alberto Bastos Machado 340', cep: '04856-080', latitude: -23.774147, longitude: -46.6923214, aproximado: true, participante: false },
  { nome: 'EE Emilio Warwick Kerr Pastor', endereco: 'Rua Walter Sgarbi 700', cep: '04845-270', latitude: -23.7532012, longitude: -46.6972874, aproximado: false, participante: false },
  { nome: 'EE Esther Garcia Profa', endereco: 'Av Antonio Carlos Benjamim dos Santos 858', cep: '04856-070', latitude: -23.772032, longitude: -46.6998464, aproximado: true, participante: false },
  { nome: 'EE Euripedes Simoes de Paula Prof', endereco: 'Rua Maria Pape 30', cep: '04852-218', latitude: -23.7615272, longitude: -46.6732508, aproximado: false, participante: false },
  { nome: 'EE Evandro Cavalcante Lins e Silva', endereco: 'R Carmela Terranova Raimondi 47', cep: '04848-200', latitude: -23.7397769, longitude: -46.6807701, aproximado: true, participante: false },
  { nome: 'EE Francisco Roswell Freire', endereco: 'Rua Louis Daquim 199', cep: '04843-070', latitude: null, longitude: null, aproximado: false, participante: false },
  { nome: 'EE Gerson de Moura Muzel Prof', endereco: 'Avenida Carlos Alberto Bastos Machado S/nº', cep: '', latitude: -23.774147, longitude: -46.6923214, aproximado: true, participante: false },
  { nome: 'EE Herbert Baldus', endereco: 'Rua Canção da Terra 100', cep: '04844-560', latitude: -23.7584815, longitude: -46.7043272, aproximado: false, participante: false },
  { nome: 'EE Herminio Sacchetta', endereco: 'Av Paulo Guilguer Reimberg 9865', cep: '04858-570', latitude: -23.7674482, longitude: -46.7159416, aproximado: true, participante: false },
  { nome: 'EE Hilda Ferraz Kfouri', endereco: '', cep: '', latitude: null, longitude: null, aproximado: false, participante: false },
  { nome: 'EE Ilda Vieira Vilela', endereco: 'Rua Min Mario David Andreazza 50', cep: '04849-080', latitude: -23.7422, longitude: -46.6725, aproximado: true, participante: false },
  { nome: 'EE Irmã Charlita', endereco: 'Rua Adelia da Silva Mendes 700', cep: '04850-020', latitude: -23.7518126, longitude: -46.6809901, aproximado: false, participante: false },
  { nome: 'EE Itiro Muto', endereco: 'Rua Paulo Araujo Novaes 190', cep: '04822-010', latitude: -23.7290961, longitude: -46.6894686, aproximado: false, participante: false },
  { nome: 'EE Jacob Thomaz Itapura de Miranda Prof', endereco: 'Rua Antonio Felipe Filho 93', cep: '04845-000', latitude: -23.7494697, longitude: -46.6901347, aproximado: false, participante: false },
  { nome: 'EE Jardim Noronha V', endereco: 'Rua Rufino Zago S/n', cep: '04853-070', latitude: -23.7688126, longitude: -46.6768493, aproximado: true, participante: false },
  { nome: 'EE Joao da Silva', endereco: '', cep: '', latitude: null, longitude: null, aproximado: false, participante: false },
  { nome: 'EE Joao Goulart Presidente', endereco: 'Rua São José do Rio Preto S/nº', cep: '04840-460', latitude: -23.7530969, longitude: -46.683442, aproximado: true, participante: false },
  { nome: 'EE Jose Bento Renato Monteiro Lobato', endereco: 'Rua Padre Hans Klein 92', cep: '04851-000', latitude: -23.7522, longitude: -46.6742, aproximado: true, participante: false },
  { nome: 'EE Jose Ephim Mindlin', endereco: 'Rua Augusto Teixeira 101', cep: '04841-160', latitude: -23.7392247, longitude: -46.6866743, aproximado: false, participante: false },
  { nome: 'EE Jose Xavier Cortez', endereco: 'Rua Hierapolis 248', cep: '04859-090', latitude: -23.7657613, longitude: -46.7038034, aproximado: false, participante: false },
  { nome: 'EE Juventina Marcondes Domingues de Castro Profa', endereco: 'Rua Henrique Muzzio 233', cep: '04857-040', latitude: -23.7857707, longitude: -46.6843059, aproximado: false, participante: false },
  { nome: 'EE Leonel Brizola', endereco: 'Rua Maria Pape 30', cep: '04852-218', latitude: -23.7615272, longitude: -46.6732508, aproximado: false, participante: false },
  { nome: 'EE Levi Carneiro', endereco: 'Av Antonio Carlos B dos Santos 2882', cep: '04856-070', latitude: -23.772032, longitude: -46.6998464, aproximado: true, participante: false },
  { nome: 'EE Loteamento das Gaivotas II', endereco: 'Av São Paulo S/nº', cep: '04849-308', latitude: -23.7334467, longitude: -46.6598035, aproximado: false, participante: false },
  { nome: 'EE Maria Juvenal Homem de Mello Profa', endereco: 'Rua Miraflores 95', cep: '04842-470', latitude: -23.7406507, longitude: -46.6812157, aproximado: false, participante: false },
  { nome: 'EE Maria Luiza de Andrade Martins Roque Profa', endereco: 'Rua Marcelino Nogueira Junior 117', cep: '04851-280', latitude: -23.7528757, longitude: -46.6691519, aproximado: false, participante: false },
  { nome: 'EE Mariazinha Congílio', endereco: 'Rua da União Snº', cep: '04851-560', latitude: -23.7534234, longitude: -46.6655238, aproximado: false, participante: false },
  { nome: 'EE Marie Domineuc Madre', endereco: 'Av Paulo Guilguer Reimberg Na Altura do Nº 3.680', cep: '04856-200', latitude: -23.7782861, longitude: -46.6928378, aproximado: false, participante: false },
  { nome: 'EE Marlene Adua Fortunato Profa', endereco: 'Rua Gaivotas do Céu 53', cep: '04855-200', latitude: -23.7804311, longitude: -46.6750896, aproximado: false, participante: false },
  { nome: 'EE Nair Toledo Damiao Profa', endereco: 'Rua Jequirituba 2.114', cep: '04822-000', latitude: -23.7392026, longitude: -46.6863841, aproximado: true, participante: false },
  { nome: 'EE Neiva de Lourdes Andrade Profa', endereco: 'Rua Giuseppe Tartini 818', cep: '04844-300', latitude: -23.7542897, longitude: -46.7046704, aproximado: true, participante: false },
  { nome: 'EE Otoniel Assis de Holanda', endereco: 'Rua Tupinambá S/nº', cep: '04854-015', latitude: null, longitude: null, aproximado: false, participante: false },
  { nome: 'EE Rene Muawad Presidente', endereco: 'Rua Estela Naves Junqueira 79', cep: '04841-000', latitude: -23.7352744, longitude: -46.6899607, aproximado: false, participante: false },
  { nome: 'EE Roberto Mange', endereco: 'Avenida Carlos Alberto Bastos Machado S/nº', cep: '04856-080', latitude: -23.774147, longitude: -46.6923214, aproximado: true, participante: false },
  { nome: 'EE Samuel Wainer', endereco: 'Rua São José do Rio Preto 71', cep: '04840-460', latitude: -23.7530969, longitude: -46.683442, aproximado: true, participante: false },
  { nome: 'EE Saverio Fittipaldi', endereco: 'Rua Rufino Zago 160', cep: '04853-070', latitude: -23.7688126, longitude: -46.6768493, aproximado: true, participante: false },
  { nome: 'EE Sergio Murillo Raduan Prof.', endereco: 'Rua João Honório Caixeta 182', cep: '04857-190', latitude: -23.782307, longitude: -46.6795961, aproximado: false, participante: false },
  { nome: 'EE Tancredo de Almeida Neves Pres', endereco: 'Av Paulo Guilguer Reimberg 2448', cep: '04856-200', latitude: -23.7782861, longitude: -46.6928378, aproximado: false, participante: false },
  { nome: 'EE Vicente de Paulo Dale Coutinho Gal Exe', endereco: 'Rua Giovanni Gabrieli 712', cep: '04844-200', latitude: -23.7476084, longitude: -46.7035235, aproximado: false, participante: false },
  { nome: 'EE Vicentina Aparecida Tamborino', endereco: 'Rua João Honório Caixeta 176', cep: '04857-190', latitude: -23.782307, longitude: -46.6795961, aproximado: false, participante: false },
  { nome: 'EE Washington Alves Natel', endereco: 'Rua Min Mario David Andreazza 50', cep: '04849-080', latitude: -23.7422, longitude: -46.6725, aproximado: true, participante: false },
  { nome: 'EE Valdir Conceicao da Silva Professor', endereco: 'Rua Adelia da Silva Mendes 700', cep: '04850-020', latitude: -23.7518126, longitude: -46.6809901, aproximado: false, participante: false }]

async function main() {
  console.log('Seed: categorias...')
  for (const c of CATEGORIAS) {
    await prisma.categoria.upsert({
      where: { slug: c.slug },
      update: { nome: c.nome },
      create: c,
    })
  }

  console.log('Seed: escolas...')
  for (const e of ESCOLAS) {
    const existente = await prisma.escola.findFirst({ where: { nome: e.nome } })
    if (existente) {
      await prisma.escola.update({ where: { id: existente.id }, data: e })
    } else {
      await prisma.escola.create({ data: e })
    }
  }

  const total = await prisma.escola.count()
  console.log(`Seed concluido: ${total} escolas.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
