import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import bcrypt from 'bcrypt';
import { aplicarPepper, validarForcaSenha } from '../../config/password';
import { AuthService } from '../Auth/auth.service';
import { CreateUsuarioDTO, UpdateUsuarioDTO } from './usuario.dto';

export class UsuarioService {
  private readonly usuarioSelect = {
    id: true,
    nome: true,
    email: true,
    cargo: true,
    ativo: true,
    criado_em: true,
    ordem_id: true,
    ordem: { select: { id: true, nome: true } },
  };

  private async hashSenha(senha: string): Promise<string> {
    const validacao = validarForcaSenha(senha);
    if (!validacao.valida) {
      throw new Error(validacao.erros.join(" | "));
    }
    return bcrypt.hash(aplicarPepper(senha), 10);
  }

  async create(data: CreateUsuarioDTO) {
    if (!data.cargo) {
      throw new Error("O campo 'cargo' é obrigatório e deve ser 'ADMIN' ou 'ALUNO'.");
    }

    const hashedSenha = await this.hashSenha(data.senha);

    return prisma.usuario.create({
      data: {
        nome: data.nome,
        email: data.email,
        senha_hash: hashedSenha,
        cargo: data.cargo,
        ativo: true,
        ...(data.ordem_id != null ? { ordem_id: data.ordem_id } : {}),
      },
      select: this.usuarioSelect
    });
  }

  async getAll() {
    return prisma.usuario.findMany({
      select: this.usuarioSelect
    });
  }

  async getById(id: number) {
    return prisma.usuario.findUnique({
      where: { id },
      select: this.usuarioSelect
    });
  }

  async update(id: number, data: UpdateUsuarioDTO) {
    const updateData: any = {};

    if (data.nome) updateData.nome = data.nome;
    if (data.email) updateData.email = data.email;
    if (data.cargo) {
      if (data.cargo !== "ADMIN" && data.cargo !== "ALUNO") {
        throw new Error("Cargo inválido. Use 'ADMIN' ou 'ALUNO'.");
      }
      updateData.cargo = data.cargo;
    }
    if (data.senha) {
      updateData.senha_hash = await this.hashSenha(data.senha);
    }
    if (typeof data.ativo === "boolean") updateData.ativo = data.ativo;
    if ('ordem_id' in data) updateData.ordem_id = data.ordem_id ?? null;

    try {
      return prisma.usuario.update({
        where: { id },
        data: updateData,
        select: this.usuarioSelect
      });
    } catch (error: any) {
      throw new Error(error.message || "Erro ao atualizar usuário.");
    }
  }

  async setActive(id: number, ativo: boolean) {
    try {
      return await prisma.$transaction(async (transaction) => {
        const usuario = await transaction.usuario.update({
          where: { id },
          data: { ativo },
          select: this.usuarioSelect,
        });

        if (!ativo) {
          await transaction.sessao.deleteMany({
            where: { usuario_id: id },
          });
        }

        return usuario;
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw error;
      }
      throw new Error(error.message || "Erro ao atualizar status do usuário.");
    }
  }

  async delete(id: number) {
    return prisma.usuario.delete({
      where: { id },
      select: { id: true, nome: true, email: true }
    });
  }

  /**
   * Admin gera um link de redefinição de senha para um usuário específico.
   * Usa o AuthService para criar o token de recuperação.
   */
  async gerarLinkReset(id: number): Promise<{ link: string; expira_em: Date }> {
    const authService = new AuthService();
    return authService.gerarLinkResetAdmin(id);
  }

  /** Admin desbloqueia manualmente um usuário bloqueado por tentativas. */
  async desbloquear(id: number) {
    return prisma.usuario.update({
      where: { id },
      data: { tentativas_login: 0, bloqueado_ate: null },
      select: this.usuarioSelect,
    });
  }
}
