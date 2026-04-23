/*
  Warnings:

  - You are about to drop the column `prioridade` on the `Comunicado` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Comunicado" DROP COLUMN "prioridade";

-- DropEnum
DROP TYPE "Prioridade";
