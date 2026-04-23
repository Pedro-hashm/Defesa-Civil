/*
  Warnings:

  - You are about to drop the column `token` on the `RecuperacaoSenha` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token_hash]` on the table `RecuperacaoSenha` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expira_em` to the `RecuperacaoSenha` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_hash` to the `RecuperacaoSenha` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "RecuperacaoSenha_token_key";

-- AlterTable
ALTER TABLE "RecuperacaoSenha" DROP COLUMN "token",
ADD COLUMN     "expira_em" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "token_hash" TEXT NOT NULL,
ADD COLUMN     "usado_em" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "RecuperacaoSenha_token_hash_key" ON "RecuperacaoSenha"("token_hash");
