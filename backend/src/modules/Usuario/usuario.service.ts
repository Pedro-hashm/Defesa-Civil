import { prisma } from '../../config/prisma';
import bcrypt from 'bcrypt';
import { CreateUsuarioDTO, UpdateUsuarioDTO } from './usuario.dto';

export class UsuarioService {

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
    select: {
      id: true,
      nome: true,
      email: true,
      cargo: true,
      ativo: true,
      criado_em: true
    }
  });
}

  async getAll() {
    return prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        ativo: true,
        criado_em: true 
      }
    });
  }

  async getById(id: number) {
    return prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        ativo: true,
        criado_em: true 
      }
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
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        ativo: true,
        criado_em: true
      }
    });
  } catch (error: any) {
    throw new Error(error.message || "Erro ao atualizar usuário.");
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