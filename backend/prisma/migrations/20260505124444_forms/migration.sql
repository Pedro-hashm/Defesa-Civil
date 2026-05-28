-- CreateIndex
CREATE INDEX "RecuperacaoSenha_expira_em_idx" ON "RecuperacaoSenha"("expira_em");

-- CreateIndex
CREATE INDEX "RecuperacaoSenha_usuario_id_idx" ON "RecuperacaoSenha"("usuario_id");
