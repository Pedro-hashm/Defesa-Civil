import { prisma } from '../../config/prisma';
import { CreateOrdemDTO, UpdateOrdemDTO } from './ordem.dto';

export class OrdemService {
  private readonly select = {
    id: true,
    nome: true,
    descricao: true,
    ativo: true,
    criado_em: true,
  };

  async create(data: CreateOrdemDTO) {
    if (!data.nome?.trim()) throw new Error("O campo 'nome' é obrigatório.");
    return prisma.ordem.create({
      data: { nome: data.nome.trim(), descricao: data.descricao?.trim() },
      select: this.select,
    });
  }

  /** Retorna todas as ordens (admin). */
  async getAll() {
    return prisma.ordem.findMany({
      select: this.select,
      orderBy: { nome: 'asc' },
    });
  }

  /** Retorna apenas ordens ativas — usado nos selects do frontend. */
  async getAtivas() {
    return prisma.ordem.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, descricao: true },
      orderBy: { nome: 'asc' },
    });
  }

  async getById(id: number) {
    return prisma.ordem.findUnique({ where: { id }, select: this.select });
  }

  async update(id: number, data: UpdateOrdemDTO) {
    const updateData: any = {};
    if (data.nome !== undefined) updateData.nome = data.nome.trim();
    if (data.descricao !== undefined) updateData.descricao = data.descricao?.trim() ?? null;
    if (typeof data.ativo === 'boolean') updateData.ativo = data.ativo;

    return prisma.ordem.update({ where: { id }, data: updateData, select: this.select });
  }

  async delete(id: number) {
    // Desvincula usuários antes de excluir
    await prisma.usuario.updateMany({ where: { ordem_id: id }, data: { ordem_id: null } });
    return prisma.ordem.delete({ where: { id }, select: this.select });
  }
}
