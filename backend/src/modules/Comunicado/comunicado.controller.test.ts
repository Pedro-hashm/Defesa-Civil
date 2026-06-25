import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

const comunicadoServiceMocks = vi.hoisted(() => ({
  create: vi.fn(),
  getAll: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("./comunicado.service", () => ({
  ComunicadoService: vi.fn(() => comunicadoServiceMocks),
}));

import { ComunicadoController } from "./comunicado.controller";

const comunicadoBase = {
  id: 1,
  titulo: "Aviso Importante",
  conteudo: "Texto do aviso",
  publicado_em: new Date("2026-01-01"),
  atualizado_em: new Date("2026-01-01"),
  autor: { id: 1, nome: "Admin" },
};

function p2025() {
  return new Prisma.PrismaClientKnownRequestError("Record not found", {
    code: "P2025",
    clientVersion: "4.16",
  });
}

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

describe("ComunicadoController", () => {
  const controller = new ComunicadoController();

  beforeEach(() => vi.clearAllMocks());

  // ─── criar ──────────────────────────────────────────────────────────────────

  describe("criar", () => {
    it("retorna 201 com comunicado criado", async () => {
      comunicadoServiceMocks.create.mockResolvedValue(comunicadoBase);

      const req = criarReq({
        body: { titulo: "Aviso", conteudo: "Texto" },
        usuario: { id: 1 },
      } as any);
      const res = criarRes();
      await controller.criar(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(comunicadoBase);
      expect(comunicadoServiceMocks.create).toHaveBeenCalledWith(1, { titulo: "Aviso", conteudo: "Texto" });
    });

    it("retorna 400 para erro de validacao", async () => {
      comunicadoServiceMocks.create.mockRejectedValue(new Error("Os campos 'titulo' e 'conteudo' sao obrigatorios."));

      const req = criarReq({ body: { titulo: "" }, usuario: { id: 1 } } as any);
      const res = criarRes();
      await controller.criar(req, res);

      expect(res.statusCode).toBe(400);
      expect((res.body as any).error).toContain("obrigatorios");
    });
  });

  // ─── listar ─────────────────────────────────────────────────────────────────

  describe("listar", () => {
    it("retorna 200 com lista de comunicados", async () => {
      comunicadoServiceMocks.getAll.mockResolvedValue([comunicadoBase]);

      const res = criarRes();
      await controller.listar(criarReq(), res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([comunicadoBase]);
    });

    it("retorna 200 com lista vazia", async () => {
      comunicadoServiceMocks.getAll.mockResolvedValue([]);

      const res = criarRes();
      await controller.listar(criarReq(), res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // ─── buscar ─────────────────────────────────────────────────────────────────

  describe("buscar", () => {
    it("retorna 200 quando comunicado existe", async () => {
      comunicadoServiceMocks.getById.mockResolvedValue(comunicadoBase);

      const res = criarRes();
      await controller.buscar(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(200);
      expect((res.body as any).id).toBe(1);
    });

    it("retorna 404 quando comunicado nao existe", async () => {
      comunicadoServiceMocks.getById.mockResolvedValue(null);

      const res = criarRes();
      await controller.buscar(criarReq({ params: { id: "999" } }), res);

      expect(res.statusCode).toBe(404);
      expect((res.body as any).error).toContain("nao encontrado");
    });
  });

  // ─── atualizar ──────────────────────────────────────────────────────────────

  describe("atualizar", () => {
    it("retorna 200 com comunicado atualizado", async () => {
      comunicadoServiceMocks.update.mockResolvedValue({ ...comunicadoBase, titulo: "Novo titulo" });

      const res = criarRes();
      await controller.atualizar(criarReq({ params: { id: "1" }, body: { titulo: "Novo titulo" } }), res);

      expect(res.statusCode).toBe(200);
      expect((res.body as any).titulo).toBe("Novo titulo");
    });

    it("retorna 404 para comunicado inexistente (P2025)", async () => {
      comunicadoServiceMocks.update.mockRejectedValue(p2025());

      const res = criarRes();
      await controller.atualizar(criarReq({ params: { id: "999" }, body: { titulo: "X" } }), res);

      expect(res.statusCode).toBe(404);
      expect((res.body as any).error).toContain("nao encontrado");
    });

    it("retorna 400 para erro de validacao", async () => {
      comunicadoServiceMocks.update.mockRejectedValue(new Error("Nenhum campo valido para atualizar."));

      const res = criarRes();
      await controller.atualizar(criarReq({ params: { id: "1" }, body: {} }), res);

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── deletar ────────────────────────────────────────────────────────────────

  describe("deletar", () => {
    it("retorna 200 com mensagem e comunicado removido", async () => {
      comunicadoServiceMocks.delete.mockResolvedValue({ id: 1, titulo: "Aviso" });

      const res = criarRes();
      await controller.deletar(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(200);
      expect((res.body as any).message).toContain("deletado");
      expect((res.body as any).comunicado).toEqual({ id: 1, titulo: "Aviso" });
    });

    it("retorna 404 para comunicado inexistente (P2025)", async () => {
      comunicadoServiceMocks.delete.mockRejectedValue(p2025());

      const res = criarRes();
      await controller.deletar(criarReq({ params: { id: "999" } }), res);

      expect(res.statusCode).toBe(404);
    });

    it("retorna 400 para erro generico", async () => {
      comunicadoServiceMocks.delete.mockRejectedValue(new Error("Erro inesperado"));

      const res = criarRes();
      await controller.deletar(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(400);
    });
  });
});
