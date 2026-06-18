import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const prismaMocks = vi.hoisted(() => ({
  mockComunicadoCreate: vi.fn(),
  mockComunicadoFindMany: vi.fn(),
  mockComunicadoFindUnique: vi.fn(),
  mockComunicadoUpdate: vi.fn(),
  mockComunicadoDelete: vi.fn(),
}));

vi.mock("../../config/prisma", () => ({
  prisma: {
    comunicado: {
      create: prismaMocks.mockComunicadoCreate,
      findMany: prismaMocks.mockComunicadoFindMany,
      findUnique: prismaMocks.mockComunicadoFindUnique,
      update: prismaMocks.mockComunicadoUpdate,
      delete: prismaMocks.mockComunicadoDelete,
    },
  },
}));

import { ComunicadoService } from "./comunicado.service";

const comunicadoBase = {
  id: 1,
  titulo: "Aviso",
  conteudo: "Conteudo do aviso",
  publicado_em: new Date("2026-01-01"),
  atualizado_em: new Date("2026-01-01"),
  autor: { id: 1, nome: "Admin" },
};

describe("ComunicadoService", () => {
  const service = new ComunicadoService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("cria comunicado com titulo e conteudo trimados", async () => {
      prismaMocks.mockComunicadoCreate.mockResolvedValue(comunicadoBase);

      const resultado = await service.create(1, {
        titulo: "  Aviso  ",
        conteudo: "  Conteudo do aviso  ",
      });

      expect(prismaMocks.mockComunicadoCreate).toHaveBeenCalledWith({
        data: {
          autor_id: 1,
          titulo: "Aviso",
          conteudo: "Conteudo do aviso",
        },
        select: expect.any(Object),
      });
      expect(resultado).toEqual(comunicadoBase);
    });

    it("rejeita titulo ou conteudo vazio", async () => {
      await expect(service.create(1, { titulo: " ", conteudo: "x" })).rejects.toThrow(
        "Os campos 'titulo' e 'conteudo' sao obrigatorios."
      );
      expect(prismaMocks.mockComunicadoCreate).not.toHaveBeenCalled();
    });
  });

  describe("getAll", () => {
    it("lista comunicados por data de publicacao", async () => {
      prismaMocks.mockComunicadoFindMany.mockResolvedValue([comunicadoBase]);
      const resultado = await service.getAll();
      expect(resultado).toEqual([comunicadoBase]);
      expect(prismaMocks.mockComunicadoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { publicado_em: "desc" } })
      );
    });
  });

  describe("update", () => {
    it("atualiza campos validos", async () => {
      prismaMocks.mockComunicadoUpdate.mockResolvedValue({
        ...comunicadoBase,
        titulo: "Novo titulo",
      });

      await service.update(1, { titulo: "  Novo titulo  " });

      expect(prismaMocks.mockComunicadoUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { titulo: "Novo titulo" },
        select: expect.any(Object),
      });
    });

    it("rejeita titulo vazio", async () => {
      await expect(service.update(1, { titulo: "  " })).rejects.toThrow(
        "O campo 'titulo' nao pode ser vazio."
      );
    });

    it("rejeita atualizacao sem campos", async () => {
      await expect(service.update(1, {})).rejects.toThrow(
        "Nenhum campo valido para atualizar."
      );
    });

    it("propaga P2025 do Prisma", async () => {
      const erro = new Prisma.PrismaClientKnownRequestError("not found", {
        code: "P2025",
        clientVersion: "4.16",
      });
      prismaMocks.mockComunicadoUpdate.mockRejectedValue(erro);

      await expect(service.update(999, { titulo: "X" })).rejects.toBe(erro);
    });
  });

  describe("delete", () => {
    it("remove comunicado existente", async () => {
      prismaMocks.mockComunicadoDelete.mockResolvedValue({ id: 1, titulo: "Aviso" });
      const resultado = await service.delete(1);
      expect(resultado).toEqual({ id: 1, titulo: "Aviso" });
    });

    it("propaga P2025 ao deletar inexistente", async () => {
      const erro = new Prisma.PrismaClientKnownRequestError("not found", {
        code: "P2025",
        clientVersion: "4.16",
      });
      prismaMocks.mockComunicadoDelete.mockRejectedValue(erro);

      await expect(service.delete(999)).rejects.toBe(erro);
    });
  });
});
