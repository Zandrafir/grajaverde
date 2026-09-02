// Script avulso (nao faz parte do site) para zerar os registros de plantio
// antes de uma apresentacao - faz backup em JSON antes de apagar, e NAO
// mexe na lista de escolas nem no campo "participante" de cada uma.
//
// Como rodar (no terminal do projeto, com `npm install` ja feito):
//   node backup-e-limpar.js
//
// O backup fica salvo aqui do lado, como backup-plantios-AAAA-MM-DD.json
// (esse arquivo NAO sobe pro Git - ver .gitignore).

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const plantios = await prisma.plantio.findMany({
    include: {
      escola: { select: { nome: true } },
      categorias: { include: { categoria: true } },
      fotos: true,
    },
    orderBy: { id: 'asc' },
  });

  const dataStr = new Date().toISOString().slice(0, 10);
  const backupPath = path.join(__dirname, `backup-plantios-${dataStr}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(plantios, null, 2), 'utf-8');
  console.log(`Backup salvo: ${backupPath} (${plantios.length} plantios)`);

  const resultado = await prisma.plantio.deleteMany({});
  console.log(`${resultado.count} registros de plantio removidos.`);

  const restante = await prisma.plantio.count();
  const escolas = await prisma.escola.count();
  const participantes = await prisma.escola.count({ where: { participante: true } });
  console.log(`Verificacao: ${restante} plantios restantes (deve ser 0).`);
  console.log(`Escolas mantidas intactas: ${escolas} no total, ${participantes} marcadas como participantes.`);
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
