/*
  Warnings:

  - You are about to drop the column `expira_em` on the `RecuperacaoSenha` table. All the data in the column will be lost.
  - You are about to drop the column `token_hash` on the `RecuperacaoSenha` table. All the data in the column will be lost.
  - You are about to drop the column `usado_em` on the `RecuperacaoSenha` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token]` on the table `RecuperacaoSenha` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `prioridade` to the `Comunicado` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `RecuperacaoSenha` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- DropIndex
DROP INDEX "RecuperacaoSenha_expira_em_idx";

-- DropIndex
DROP INDEX "RecuperacaoSenha_token_hash_key";

-- DropIndex
DROP INDEX "RecuperacaoSenha_usuario_id_idx";

-- AlterTable
ALTER TABLE "Comunicado" ADD COLUMN     "prioridade" "Prioridade" NOT NULL;

-- AlterTable
ALTER TABLE "RecuperacaoSenha" DROP COLUMN "expira_em",
DROP COLUMN "token_hash",
DROP COLUMN "usado_em",
ADD COLUMN     "token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RecuperacaoSenha_token_key" ON "RecuperacaoSenha"("token");
