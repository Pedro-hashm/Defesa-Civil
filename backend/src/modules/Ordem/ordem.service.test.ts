import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  mockOrdemCreate: vi.fn(),
  mockOrdemFindMany: vi.fn(),
  mockOrdemFindUnique: vi.fn(),
  mockOrdemUpdate: vi.fn(),
  mockOrdemDelete: vi.fn(),
  mockUsuarioUpdateMany: vi.fn(),
}));

vi.mock("../../config/prisma", () => ({
  prisma: {
    ordem: {
      create: prismaMocks.mockOrdemCreate,
      findMany: prismaMocks.mockOrdemFindMany,
      findUnique: prismaMocks.mockOrdemFindUnique,
      update: prismaMocks.mockOrdemUpdate,
      delete: prismaMocks.mockOrdemDelete,
    },
    usuario: {
      updateMany: prismaMocks.mockUsuarioUpdateMany,
    },
  },
}));

import { OrdemService } from "./ordem.service";

const ordemBase = {
  id: 1,
  nome: "Bombeiros",
  descricao: "Corpo de bombeiros",
  ativo: true,
  criado_em: new Date("2026-01-01"),
};

describe("OrdemService", () => {
  const service = new OrdemService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("cria ordem com nome trimado", async () => {
      prismaMocks.mockOrdemCreate.mockResolvedValue(ordemBase);

      const resultado = await service.create({
        nome: "  Bombeiros  ",
        descricao: "  Corpo de bombeiros  ",
      });

      expect(prismaMocks.mockOrdemCreate).toHaveBeenCalledWith({
        data: { nome: "Bombeiros", descricao: "Corpo de bombeiros" },
        select: expect.any(Object),
      });
      expect(resultado).toEqual(ordemBase);
    });

    it("rejeita nome vazio", async () => {
      await expect(service.create({ nome: "   " })).rejects.toThrow(
        "O campo 'nome' é obrigatório."
      );
      expect(prismaMocks.mockOrdemCreate).not.toHaveBeenCalled();
    });
  });

  describe("getAll / getAtivas", () => {
    it("lista todas as ordens", async () => {
      prismaMocks.mockOrdemFindMany.mockResolvedValue([ordemBase]);
      const resultado = await service.getAll();
      expect(resultado).toEqual([ordemBase]);
      expect(prismaMocks.mockOrdemFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { nome: "asc" } })
      );
    });

    it("lista apenas ordens ativas", async () => {
      prismaMocks.mockOrdemFindMany.mockResolvedValue([{ id: 1, nome: "X", descricao: null }]);
      await service.getAtivas();
      expect(prismaMocks.mockOrdemFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ativo: true } })
      );
    });
  });

  describe("update", () => {
    it("atualiza campos informados", async () => {
      prismaMocks.mockOrdemUpdate.mockResolvedValue({ ...ordemBase, nome: "Nova" });

      await service.update(1, { nome: "  Nova  ", ativo: false });

      expect(prismaMocks.mockOrdemUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nome: "Nova", ativo: false },
        select: expect.any(Object),
      });
    });
  });

  describe("delete", () => {
    it("desvincula usuarios antes de excluir", async () => {
      prismaMocks.mockUsuarioUpdateMany.mockResolvedValue({ count: 2 });
      prismaMocks.mockOrdemDelete.mockResolvedValue(ordemBase);

      await service.delete(1);

      expect(prismaMocks.mockUsuarioUpdateMany).toHaveBeenCalledWith({
        where: { ordem_id: 1 },
        data: { ordem_id: null },
      });
      expect(prismaMocks.mockOrdemDelete).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.any(Object),
      });
    });
  });
});
