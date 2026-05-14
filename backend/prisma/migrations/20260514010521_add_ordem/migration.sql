-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "bloqueado_ate" TIMESTAMP(3),
ADD COLUMN     "ordem_id" INTEGER,
ADD COLUMN     "tentativas_login" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Ordem" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ordem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ordem_nome_key" ON "Ordem"("nome");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_ordem_id_fkey" FOREIGN KEY ("ordem_id") REFERENCES "Ordem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
