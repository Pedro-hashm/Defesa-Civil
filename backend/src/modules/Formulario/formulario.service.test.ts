import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma, StatusTentativa } from "@prisma/client";
import { FormularioService } from "./formulario.service";

const prismaMocks = vi.hoisted(() => ({
  mockFormularioFindMany: vi.fn(),
  mockFormularioFindFirst: vi.fn(),
  mockTentativaFindMany: vi.fn(),
  mockTentativaFindUnique: vi.fn(),
  mockTentativaCreate: vi.fn(),
  mockTentativaUpdate: vi.fn(),
  mockTentativaDelete: vi.fn(),
}));

vi.mock("../../config/prisma", () => ({
  prisma: {
    formulario: {
      findMany: prismaMocks.mockFormularioFindMany,
      findFirst: prismaMocks.mockFormularioFindFirst,
    },
    tentativaFormulario: {
      findMany: prismaMocks.mockTentativaFindMany,
      findUnique: prismaMocks.mockTentativaFindUnique,
      create: prismaMocks.mockTentativaCreate,
      update: prismaMocks.mockTentativaUpdate,
      delete: prismaMocks.mockTentativaDelete,
    },
  },
}));

const {
  mockFormularioFindMany,
  mockFormularioFindFirst,
  mockTentativaFindMany,
  mockTentativaFindUnique,
  mockTentativaCreate,
  mockTentativaUpdate,
  mockTentativaDelete,
} = prismaMocks;

const tentativaMontada = {
  id: 1,
  usuario_id: 10,
  formulario_id: 2,
  respostas: { secao_1: { uf: "PE" } },
  erros: null,
  status: StatusTentativa.FINALIZADO,
  iniciado_em: new Date("2026-01-01"),
  finalizado_em: new Date("2026-01-02"),
  usuario: {
    id: 10,
    nome: "Aluno Teste",
    email: "aluno@teste.local",
    cargo: "ALUNO" as const,
  },
  formulario: {
    id: 2,
    titulo: "FIDE — Padrão (SEDEC/MIDR)",
    descricao: "desc",
  },
};

describe("FormularioService — ciclo de formulários e tentativas", () => {
  const service = new FormularioService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listarFormularios / buscarFormulario", () => {
    it("lista apenas formulários ativos", async () => {
      const forms = [
        { id: 1, titulo: "FIDE", descricao: null, ativo: true, criado_em: new Date() },
      ];
      mockFormularioFindMany.mockResolvedValue(forms);

      const result = await service.listarFormularios();

      expect(mockFormularioFindMany).toHaveBeenCalledWith({
        where: { ativo: true },
        orderBy: { id: "asc" },
        select: expect.any(Object),
      });
      expect(result).toEqual(forms);
    });

    it("busca formulário ativo por id", async () => {
      const detalhe = {
        id: 2,
        titulo: "DMATE",
        descricao: "x",
        ativo: true,
        criado_em: new Date(),
        estrutura: { documento: "DMATE" },
      };
      mockFormularioFindFirst.mockResolvedValue(detalhe);

      const result = await service.buscarFormulario(2);

      expect(mockFormularioFindFirst).toHaveBeenCalledWith({
        where: { id: 2, ativo: true },
        select: expect.any(Object),
      });
      expect(result).toEqual(detalhe);
    });
  });

  describe("criarTentativa", () => {
    it("cria tentativa quando formulário existe e respostas é objeto", async () => {
      mockFormularioFindFirst.mockResolvedValue({
        id: 2,
        titulo: "FIDE",
        ativo: true,
      });
      mockTentativaCreate.mockResolvedValue(tentativaMontada);

      const result = await service.criarTentativa(10, {
        formulario_id: 2,
        respostas: { identificacao: { uf: "PE", municipio: "Araripina" } },
      });

      expect(mockFormularioFindFirst).toHaveBeenCalledWith({
        where: { id: 2, ativo: true },
      });
      expect(mockTentativaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          usuario_id: 10,
          formulario_id: 2,
          status: StatusTentativa.FINALIZADO,
          respostas: { identificacao: { uf: "PE", municipio: "Araripina" } },
          finalizado_em: expect.any(Date),
        }),
        select: expect.any(Object),
      });
      expect(result).toEqual(tentativaMontada);
    });

    it("rejeita respostas que não são objeto", async () => {
      await expect(
        service.criarTentativa(10, {
          formulario_id: 1,
          respostas: [] as unknown as Record<string, unknown>,
        })
      ).rejects.toThrow("O campo 'respostas' deve ser um objeto JSON.");

      expect(mockFormularioFindFirst).not.toHaveBeenCalled();
    });

    it("rejeita quando formulário não existe ou está inativo", async () => {
      mockFormularioFindFirst.mockResolvedValue(null);

      await expect(
        service.criarTentativa(10, {
          formulario_id: 99,
          respostas: { a: 1 },
        })
      ).rejects.toThrow("Formulario nao encontrado ou inativo.");

      expect(mockTentativaCreate).not.toHaveBeenCalled();
    });

    it("envia Prisma.JsonNull quando erros é null", async () => {
      mockFormularioFindFirst.mockResolvedValue({ id: 1, ativo: true });
      mockTentativaCreate.mockResolvedValue(tentativaMontada);

      await service.criarTentativa(10, {
        formulario_id: 1,
        respostas: { x: 1 },
        erros: null,
      });

      expect(mockTentativaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          erros: Prisma.JsonNull,
        }),
        select: expect.any(Object),
      });
    });

    it("normaliza mapa GeoJSON em respostas.fide.mapa_geojson", async () => {
      mockFormularioFindFirst.mockResolvedValue({ id: 2, titulo: "FIDE", ativo: true });
      mockTentativaCreate.mockResolvedValue(tentativaMontada);

      const geojson = JSON.stringify({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [[[-34.9, -8.1], [-34.8, -8.1], [-34.8, -8.2], [-34.9, -8.1]]],
            },
          },
        ],
      });

      await service.criarTentativa(10, {
        formulario_id: 2,
        respostas: {
          fide: {
            municipio: "Recife",
            mapa_geojson: geojson,
          },
        },
      });

      expect(mockTentativaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          respostas: expect.objectContaining({
            fide: expect.objectContaining({
              mapa_geojson: expect.objectContaining({ type: "FeatureCollection" }),
              areaPopulacaoAfetada: expect.objectContaining({
                mapa_selecao: expect.objectContaining({ type: "FeatureCollection" }),
              }),
            }),
          }),
        }),
        select: expect.any(Object),
      });
    });

    it("rejeita GeoJSON com poligono nao fechado", async () => {
      mockFormularioFindFirst.mockResolvedValue({ id: 2, titulo: "FIDE", ativo: true });

      const geojsonAberto = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [[[-34.9, -8.1], [-34.8, -8.1], [-34.8, -8.2], [-34.9, -8.2]]],
            },
          },
        ],
      };

      await expect(
        service.criarTentativa(10, {
          formulario_id: 2,
          respostas: {
            fide: {
              mapa_geojson: geojsonAberto,
            },
          },
        })
      ).rejects.toThrow("GeoJSON invalido: o poligono deve estar fechado.");

      expect(mockTentativaCreate).not.toHaveBeenCalled();
    });
  });

  describe("listarTentativas", () => {
    it("ALUNO filtra por usuario_id", async () => {
      mockTentativaFindMany.mockResolvedValue([tentativaMontada]);

      await service.listarTentativas(10, "ALUNO");

      expect(mockTentativaFindMany).toHaveBeenCalledWith({
        where: { usuario_id: 10 },
        orderBy: { iniciado_em: "desc" },
        select: expect.any(Object),
      });
    });

    it("ADMIN lista todas as tentativas", async () => {
      mockTentativaFindMany.mockResolvedValue([tentativaMontada]);

      await service.listarTentativas(1, "ADMIN");

      expect(mockTentativaFindMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { iniciado_em: "desc" },
        select: expect.any(Object),
      });
    });
  });

  describe("buscarTentativa", () => {
    it("retorna tentativa quando ALUNO é o dono", async () => {
      mockTentativaFindUnique.mockResolvedValue(tentativaMontada);

      const row = await service.buscarTentativa(1, 10, "ALUNO");

      expect(row).toEqual(tentativaMontada);
    });

    it("retorna null quando id não existe", async () => {
      mockTentativaFindUnique.mockResolvedValue(null);

      const row = await service.buscarTentativa(999, 10, "ALUNO");

      expect(row).toBeNull();
    });

    it("ALUNO não autorizado recebe erro quando tentativa é de outro usuário", async () => {
      mockTentativaFindUnique.mockResolvedValue({
        ...tentativaMontada,
        usuario_id: 99,
      });

      await expect(service.buscarTentativa(1, 10, "ALUNO")).rejects.toThrow(
        "Acesso negado a esta tentativa."
      );
    });

    it("ADMIN acessa tentativa de qualquer usuário", async () => {
      mockTentativaFindUnique.mockResolvedValue({
        ...tentativaMontada,
        usuario_id: 99,
      });

      const row = await service.buscarTentativa(1, 1, "ADMIN");

      expect(row?.usuario_id).toBe(99);
    });
  });

  describe("atualizarTentativa", () => {
    it("atualiza quando dono ALUNO envia novas respostas", async () => {
      mockTentativaFindUnique.mockResolvedValue({
        id: 1,
        usuario_id: 10,
        finalizado_em: new Date(),
        formulario_id: 2,
        respostas: {},
        erros: null,
        status: StatusTentativa.FINALIZADO,
        iniciado_em: new Date(),
      });
      const atualizado = { ...tentativaMontada, respostas: { b: 2 } };
      mockTentativaUpdate.mockResolvedValue(atualizado);

      const result = await service.atualizarTentativa(1, 10, "ALUNO", {
        respostas: { b: 2 },
      });

      expect(mockTentativaUpdate).toHaveBeenCalled();
      expect(result.respostas).toEqual({ b: 2 });
    });

    it("lança P2025 quando tentativa não existe", async () => {
      mockTentativaFindUnique.mockResolvedValue(null);

      await expect(
        service.atualizarTentativa(1, 10, "ALUNO", { respostas: { a: 1 } })
      ).rejects.toMatchObject({ code: "P2025" });
    });

    it("rejeita atualização sem campos válidos", async () => {
      mockTentativaFindUnique.mockResolvedValue({
        id: 1,
        usuario_id: 10,
        finalizado_em: null,
        formulario_id: 2,
        respostas: {},
        erros: null,
        status: StatusTentativa.INICIADO,
        iniciado_em: new Date(),
      });

      await expect(
        service.atualizarTentativa(1, 10, "ALUNO", {})
      ).rejects.toThrow("Nenhum campo valido para atualizar.");
    });
  });

  describe("deletarTentativa", () => {
    it("remove quando ALUNO é dono", async () => {
      mockTentativaFindUnique.mockResolvedValue({
        id: 1,
        usuario_id: 10,
      });
      mockTentativaDelete.mockResolvedValue({
        id: 1,
        formulario_id: 2,
        usuario_id: 10,
      });

      const result = await service.deletarTentativa(1, 10, "ALUNO");

      expect(mockTentativaDelete).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, formulario_id: true, usuario_id: true },
      });
      expect(result.id).toBe(1);
    });

    it("lança P2025 quando não existe", async () => {
      mockTentativaFindUnique.mockResolvedValue(null);

      await expect(
        service.deletarTentativa(1, 10, "ALUNO")
      ).rejects.toMatchObject({ code: "P2025" });
    });

    it("ALUNO não dono não pode apagar", async () => {
      mockTentativaFindUnique.mockResolvedValue({
        id: 1,
        usuario_id: 99,
      });

      await expect(
        service.deletarTentativa(1, 10, "ALUNO")
      ).rejects.toThrow("Acesso negado a esta tentativa.");

      expect(mockTentativaDelete).not.toHaveBeenCalled();
    });
  });
});
