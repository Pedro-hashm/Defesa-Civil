import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

const ordemServiceMocks = vi.hoisted(() => ({
  create: vi.fn(),
  getAll: vi.fn(),
  getAtivas: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("./ordem.service", () => ({
  OrdemService: vi.fn(() => ordemServiceMocks),
}));

import { OrdemController } from "./ordem.controller";

const ordemBase = {
  id: 1,
  nome: "Bombeiros",
  descricao: "Corpo de Bombeiros Municipal",
  ativo: true,
  criado_em: new Date("2026-01-01"),
};

function criarReq(override: Record<string, unknown> = {}): Request {
  return { body: {}, params: {}, headers: {}, ...override } as unknown as Request;
}

function criarRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe("OrdemController", () => {
  const controller = new OrdemController();

  beforeEach(() => vi.clearAllMocks());

  // ─── criar ──────────────────────────────────────────────────────────────────

  describe("criar", () => {
    it("retorna 201 com ordem criada", async () => {
      ordemServiceMocks.create.mockResolvedValue(ordemBase);

      const res = criarRes();
      await controller.criar(criarReq({ body: { nome: "Bombeiros" } }), res);

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(ordemBase);
    });

    it("retorna 400 para nome duplicado (P2002)", async () => {
      ordemServiceMocks.create.mockRejectedValue({ code: "P2002" });

      const res = criarRes();
      await controller.criar(criarReq({ body: { nome: "Bombeiros" } }), res);

      expect(res.statusCode).toBe(400);
      expect((res.body as any).error).toContain("Já existe uma ordem");
    });

    it("retorna 400 para erro de validacao", async () => {
      ordemServiceMocks.create.mockRejectedValue(new Error("O campo 'nome' é obrigatório."));

      const res = criarRes();
      await controller.criar(criarReq({ body: { nome: "" } }), res);

      expect(res.statusCode).toBe(400);
      expect((res.body as any).error).toContain("obrigatório");
    });
  });

  // ─── listar ─────────────────────────────────────────────────────────────────

  describe("listar", () => {
    it("retorna 200 com todas as ordens", async () => {
      ordemServiceMocks.getAll.mockResolvedValue([ordemBase]);

      const res = criarRes();
      await controller.listar(criarReq(), res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([ordemBase]);
    });
  });

  // ─── listarAtivas ───────────────────────────────────────────────────────────

  describe("listarAtivas", () => {
    it("retorna 200 com ordens ativas para select", async () => {
      ordemServiceMocks.getAtivas.mockResolvedValue([{ id: 1, nome: "Bombeiros", descricao: null }]);

      const res = criarRes();
      await controller.listarAtivas(criarReq(), res);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─── buscar ─────────────────────────────────────────────────────────────────

  describe("buscar", () => {
    it("retorna 200 quando ordem existe", async () => {
      ordemServiceMocks.getById.mockResolvedValue(ordemBase);

      const res = criarRes();
      await controller.buscar(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(200);
      expect((res.body as any).nome).toBe("Bombeiros");
    });

    it("retorna 404 quando ordem nao existe", async () => {
      ordemServiceMocks.getById.mockResolvedValue(null);

      const res = criarRes();
      await controller.buscar(criarReq({ params: { id: "999" } }), res);

      expect(res.statusCode).toBe(404);
      expect((res.body as any).error).toContain("não encontrada");
    });
  });

  // ─── atualizar ──────────────────────────────────────────────────────────────

  describe("atualizar", () => {
    it("retorna 200 com ordem atualizada", async () => {
      ordemServiceMocks.update.mockResolvedValue({ ...ordemBase, nome: "Defesa Civil" });

      const res = criarRes();
      await controller.atualizar(criarReq({ params: { id: "1" }, body: { nome: "Defesa Civil" } }), res);

      expect(res.statusCode).toBe(200);
      expect((res.body as any).nome).toBe("Defesa Civil");
    });

    it("retorna 400 para nome duplicado (P2002)", async () => {
      ordemServiceMocks.update.mockRejectedValue({ code: "P2002" });

      const res = criarRes();
      await controller.atualizar(criarReq({ params: { id: "1" }, body: { nome: "X" } }), res);

      expect(res.statusCode).toBe(400);
      expect((res.body as any).error).toContain("Já existe uma ordem");
    });

    it("retorna 400 para erro generico", async () => {
      ordemServiceMocks.update.mockRejectedValue(new Error("Erro ao atualizar"));

      const res = criarRes();
      await controller.atualizar(criarReq({ params: { id: "1" }, body: {} }), res);

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── deletar ────────────────────────────────────────────────────────────────

  describe("deletar", () => {
    it("retorna 200 com mensagem e ordem removida", async () => {
      ordemServiceMocks.delete.mockResolvedValue(ordemBase);

      const res = criarRes();
      await controller.deletar(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(200);
      expect((res.body as any).message).toContain("excluída");
      expect((res.body as any).ordem).toEqual(ordemBase);
    });

    it("retorna 400 para erro", async () => {
      ordemServiceMocks.delete.mockRejectedValue(new Error("Erro ao excluir"));

      const res = criarRes();
      await controller.deletar(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(400);
    });
  });
});
