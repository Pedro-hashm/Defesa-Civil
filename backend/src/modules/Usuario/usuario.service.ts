import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import bcrypt from 'bcrypt';
import { CreateUsuarioDTO, UpdateUsuarioDTO } from './usuario.dto';

export class UsuarioService {
  private readonly usuarioSelect = {
    id: true,
    nome: true,
    email: true,
    cargo: true,
    ativo: true,
    criado_em: true,
  };

async create(data: CreateUsuarioDTO) {
  const salt = await bcrypt.genSalt(10);
  const hashedSenha = await bcrypt.hash(data.senha_hash, salt);

  // Garante que cargo existe
  if (!data.cargo) {
    throw new Error("O campo 'cargo' é obrigatório e deve ser 'ADMIN' ou 'ALUNO'.");
  }

  return prisma.usuario.create({
    data: {
      nome: data.nome,
      email: data.email,
      senha_hash: hashedSenha,
      cargo: data.cargo,  // <-- deve ser 'ADMIN' ou 'ALUNO'
      ativo: true,        // padrão
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
  if (data.senha_hash) {
    const salt = await bcrypt.genSalt(10);
    updateData.senha_hash = await bcrypt.hash(data.senha_hash, salt);
  }
  if (typeof data.ativo === "boolean") updateData.ativo = data.ativo;

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
      select: {
        id: true,
        nome: true,
        email: true
      }
    });
  }
}