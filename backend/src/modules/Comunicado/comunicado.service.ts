import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { CreateComunicadoDTO, UpdateComunicadoDTO } from './comunicado.dto';

const comunicadoSelect = {
  id: true,
  titulo: true,
  conteudo: true,
  publicado_em: true,
  atualizado_em: true,
  autor: {
    select: {
      id: true,
      nome: true,
    },
  },
};

export class ComunicadoService {
  async create(autorId: number, data: CreateComunicadoDTO) {
    if (!data.titulo?.trim() || !data.conteudo?.trim()) {
      throw new Error("Os campos 'titulo' e 'conteudo' sao obrigatorios.");
    }

    return prisma.comunicado.create({
      data: {
        autor_id: autorId,
        titulo: data.titulo.trim(),
        conteudo: data.conteudo.trim(),
      },
      select: comunicadoSelect,
    });
  }

  async getAll() {
    return prisma.comunicado.findMany({
      orderBy: { publicado_em: 'desc' },
      select: comunicadoSelect,
    });
  }

  async getById(id: number) {
    return prisma.comunicado.findUnique({
      where: { id },
      select: comunicadoSelect,
    });
  }

  async update(id: number, data: UpdateComunicadoDTO) {
    const updateData: Prisma.ComunicadoUpdateInput = {};

    if (data.titulo !== undefined) {
      if (!data.titulo.trim()) throw new Error("O campo 'titulo' nao pode ser vazio.");
      updateData.titulo = data.titulo.trim();
    }

    if (data.conteudo !== undefined) {
      if (!data.conteudo.trim()) throw new Error("O campo 'conteudo' nao pode ser vazio.");
      updateData.conteudo = data.conteudo.trim();
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("Nenhum campo valido para atualizar.");
    }

    try {
      return await prisma.comunicado.update({
        where: { id },
        data: updateData,
        select: comunicadoSelect,
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw error;
      }
      throw new Error(error.message || "Erro ao atualizar comunicado.");
    }
  }

  async delete(id: number) {
    try {
      return await prisma.comunicado.delete({
        where: { id },
        select: { id: true, titulo: true },
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw error;
      }
      throw new Error(error.message || "Erro ao deletar comunicado.");
    }
  }
}
