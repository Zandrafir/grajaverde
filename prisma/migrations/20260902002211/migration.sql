-- CreateTable
CREATE TABLE "escolas" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "cep" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "aproximado" BOOLEAN NOT NULL DEFAULT false,
    "participante" BOOLEAN NOT NULL DEFAULT false,
    "tokenEdicao" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escolas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantios" (
    "id" SERIAL NOT NULL,
    "escolaId" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "especie" TEXT,
    "disciplinaEnvolvida" TEXT,
    "nomeProjeto" TEXT,
    "dataRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plantios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantio_categorias" (
    "plantioId" INTEGER NOT NULL,
    "categoriaId" INTEGER NOT NULL,

    CONSTRAINT "plantio_categorias_pkey" PRIMARY KEY ("plantioId","categoriaId")
);

-- CreateTable
CREATE TABLE "fotos_plantio" (
    "id" SERIAL NOT NULL,
    "plantioId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "fotos_plantio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "escolas_tokenEdicao_key" ON "escolas"("tokenEdicao");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_slug_key" ON "categorias"("slug");

-- AddForeignKey
ALTER TABLE "plantios" ADD CONSTRAINT "plantios_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantio_categorias" ADD CONSTRAINT "plantio_categorias_plantioId_fkey" FOREIGN KEY ("plantioId") REFERENCES "plantios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantio_categorias" ADD CONSTRAINT "plantio_categorias_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_plantio" ADD CONSTRAINT "fotos_plantio_plantioId_fkey" FOREIGN KEY ("plantioId") REFERENCES "plantios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
