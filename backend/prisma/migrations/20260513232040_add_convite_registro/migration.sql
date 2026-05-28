-- CreateTable
CREATE TABLE "ConviteRegistro" (
    "id" SERIAL NOT NULL,
    "criado_por_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "email" TEXT,
    "cargo" "Cargo" NOT NULL DEFAULT 'ALUNO',
    "expira_em" TIMESTAMP(3) NOT NULL,
    "usado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConviteRegistro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConviteRegistro_token_hash_key" ON "ConviteRegistro"("token_hash");

-- AddForeignKey
ALTER TABLE "ConviteRegistro" ADD CONSTRAINT "ConviteRegistro_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
