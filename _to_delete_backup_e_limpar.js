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
  const backupPath = path.join(process.env.BACKUP_DIR, `backup-plantios-${dataStr}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(plantios, null, 2), 'utf-8');
  console.log('BACKUP_OK', backupPath, plantios.length, 'plantios salvos');

  const resultado = await prisma.plantio.deleteMany({});
  console.log('DELETE_OK', resultado.count, 'plantios removidos');

  const restante = await prisma.plantio.count();
  console.log('VERIFICACAO', restante, 'plantios restantes (deve ser 0)');

  const escolas = await prisma.escola.count();
  const participantes = await prisma.escola.count({ where: { participante: true } });
  console.log('ESCOLAS_INTACTAS', escolas, 'total,', participantes, 'participantes (mantido como estava)');
}

main()
  .catch((e) => {
    console.error('ERRO', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
