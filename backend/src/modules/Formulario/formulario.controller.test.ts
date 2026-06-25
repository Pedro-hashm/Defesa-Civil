import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { Prisma, StatusTentativa } from "@prisma/client";

const formularioServiceMocks = vi.hoisted(() => ({
  listarFormularios: vi.fn(),
  buscarFormulario: vi.fn(),
  criarTentativa: vi.fn(),
  listarTentativas: vi.fn(),
  listarTentativasSupervisor: vi.fn(),
  buscarTentativa: vi.fn(),
  atualizarTentativa: vi.fn(),
  deletarTentativa: vi.fn(),
}));

vi.mock("./formulario.service", () => ({
  FormularioService: vi.fn(() => formularioServiceMocks),
}));

import { FormularioController } from "./formulario.controller";

const usuarioAdmin = { id: 1, nome: "Admin", email: "admin@test.local", cargo: "ADMIN" as const, ativo: true, criado_em: new Date() };
const usuarioAluno = { id: 10, nome: "Aluno", email: "aluno@test.local", cargo: "ALUNO" as const, ativo: true, criado_em: new Date() };

const formularioBase = { id: 2, titulo: "FIDE", descricao: "desc", ativo: true, criado_em: new Date() };

const tentativaBase = {
  id: 1,
  usuario_id: 10,
  formulario_id: 2,
  respostas: { uf: "PE" },
  erros: null,
  status: StatusTentativa.FINALIZADO,
  iniciado_em: new Date("2026-01-01"),
  finalizado_em: new Date("2026-01-02"),
  usuario: usuarioAluno,
  formulario: { id: 2, titulo: "FIDE", descricao: "desc" },
};

function p2025() {
  return new Prisma.PrismaClientKnownRequestError("Record not found", {
    code: "P2025",
    clientVersion: "4.16",
  });
}

function criarReq(override: Record<string, unknown> = {}): Request {
  return { body: {}, params: {}, headers: {}, usuario: usuarioAluno, ...override } as unknown as Request;
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

describe("FormularioController", () => {
  const controller = new FormularioController();

  beforeEach(() => vi.clearAllMocks());

  // ─── listarFormularios ──────────────────────────────────────────────────────

  describe("listarFormularios", () => {
    it("retorna 200 com lista de formularios ativos", async () => {
      formularioServiceMocks.listarFormularios.mockResolvedValue([formularioBase]);

      const res = criarRes();
      await controller.listarFormularios(criarReq(), res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([formularioBase]);
    });
  });

  // ─── buscarFormulario ───────────────────────────────────────────────────────

  describe("buscarFormulario", () => {
    it("retorna 200 quando formulario existe", async () => {
      formularioServiceMocks.buscarFormulario.mockResolvedValue({ ...formularioBase, estrutura: {} });

      const res = criarRes();
      await controller.buscarFormulario(criarReq({ params: { id: "2" } }), res);

      expect(res.statusCode).toBe(200);
      expect((res.body as any).id).toBe(2);
    });

    it("retorna 404 quando formulario nao existe", async () => {
      formularioServiceMocks.buscarFormulario.mockResolvedValue(null);

      const res = criarRes();
      await controller.buscarFormulario(criarReq({ params: { id: "999" } }), res);

      expect(res.statusCode).toBe(404);
    });

    it("retorna 400 para ID invalido (NaN)", async () => {
      const res = criarRes();
      await controller.buscarFormulario(criarReq({ params: { id: "abc" } }), res);

      expect(res.statusCode).toBe(400);
      expect((res.body as any).error).toBe("ID invalido.");
      expect(formularioServiceMocks.buscarFormulario).not.toHaveBeenCalled();
    });
  });

  // ─── criarTentativa ─────────────────────────────────────────────────────────

  describe("criarTentativa", () => {
    it("retorna 201 com tentativa criada", async () => {
      formularioServiceMocks.criarTentativa.mockResolvedValue(tentativaBase);

      const req = criarReq({
        body: { formulario_id: 2, respostas: { uf: "PE" } },
        usuario: usuarioAluno,
      } as any);
      const res = criarRes();
      await controller.criarTentativa(req, res);

      expect(res.statusCode).toBe(201);
      expect(formularioServiceMocks.criarTentativa).toHaveBeenCalledWith(10, { formulario_id: 2, respostas: { uf: "PE" } });
    });

    it("retorna 400 para formulario nao encontrado", async () => {
      formularioServiceMocks.criarTentativa.mockRejectedValue(new Error("Formulario nao encontrado ou inativo."));

      const res = criarRes();
      await controller.criarTentativa(criarReq({ usuario: usuarioAluno } as any), res);

      expect(res.statusCode).toBe(400);
      expect((res.body as any).error).toContain("nao encontrado");
    });

    it("retorna 400 para respostas invalidas", async () => {
      formularioServiceMocks.criarTentativa.mockRejectedValue(new Error("O campo 'respostas' deve ser um objeto JSON."));

      const res = criarRes();
      await controller.criarTentativa(criarReq({ usuario: usuarioAluno } as any), res);

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── listarTentativas ───────────────────────────────────────────────────────

  describe("listarTentativas", () => {
    it("retorna 200 usando id e cargo do usuario autenticado", async () => {
      formularioServiceMocks.listarTentativas.mockResolvedValue([tentativaBase]);

      const res = criarRes();
      await controller.listarTentativas(criarReq({ usuario: usuarioAluno } as any), res);

      expect(res.statusCode).toBe(200);
      expect(formularioServiceMocks.listarTentativas).toHaveBeenCalledWith(10, "ALUNO");
    });
  });

  // ─── listarTentativasSupervisor ─────────────────────────────────────────────

  describe("listarTentativasSupervisor", () => {
    it("retorna 200 com todas as tentativas", async () => {
      formularioServiceMocks.listarTentativasSupervisor.mockResolvedValue([tentativaBase]);

      const res = criarRes();
      await controller.listarTentativasSupervisor(criarReq({ usuario: usuarioAdmin } as any), res);

      expect(res.statusCode).toBe(200);
    });
  });

  // ─── buscarTentativa ────────────────────────────────────────────────────────

  describe("buscarTentativa", () => {
    it("retorna 200 quando tentativa existe e usuario tem acesso", async () => {
      formularioServiceMocks.buscarTentativa.mockResolvedValue(tentativaBase);

      const res = criarRes();
      await controller.buscarTentativa(criarReq({ params: { id: "1" }, usuario: usuarioAluno } as any), res);

      expect(res.statusCode).toBe(200);
    });

    it("retorna 404 quando tentativa nao existe", async () => {
      formularioServiceMocks.buscarTentativa.mockResolvedValue(null);

      const res = criarRes();
      await controller.buscarTentativa(criarReq({ params: { id: "999" } }), res);

      expect(res.statusCode).toBe(404);
    });

    it("retorna 403 para acesso negado", async () => {
      formularioServiceMocks.buscarTentativa.mockRejectedValue(new Error("Acesso negado a esta tentativa."));

      const res = criarRes();
      await controller.buscarTentativa(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(403);
    });

    it("retorna 400 para ID invalido (NaN)", async () => {
      const res = criarRes();
      await controller.buscarTentativa(criarReq({ params: { id: "abc" } }), res);

      expect(res.statusCode).toBe(400);
      expect(formularioServiceMocks.buscarTentativa).not.toHaveBeenCalled();
    });
  });

  // ─── atualizarTentativa ─────────────────────────────────────────────────────

  describe("atualizarTentativa", () => {
    it("retorna 200 com tentativa atualizada", async () => {
      formularioServiceMocks.atualizarTentativa.mockResolvedValue({ ...tentativaBase, respostas: { uf: "RJ" } });

      const res = criarRes();
      await controller.atualizarTentativa(
        criarReq({ params: { id: "1" }, body: { respostas: { uf: "RJ" } }, usuario: usuarioAluno } as any),
        res
      );

      expect(res.statusCode).toBe(200);
    });

    it("retorna 404 para P2025", async () => {
      formularioServiceMocks.atualizarTentativa.mockRejectedValue(p2025());

      const res = criarRes();
      await controller.atualizarTentativa(criarReq({ params: { id: "999" } }), res);

      expect(res.statusCode).toBe(404);
    });

    it("retorna 403 para acesso negado", async () => {
      formularioServiceMocks.atualizarTentativa.mockRejectedValue(new Error("Acesso negado a esta tentativa."));

      const res = criarRes();
      await controller.atualizarTentativa(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(403);
    });

    it("retorna 400 para ID invalido (NaN)", async () => {
      const res = criarRes();
      await controller.atualizarTentativa(criarReq({ params: { id: "xyz" } }), res);

      expect(res.statusCode).toBe(400);
      expect(formularioServiceMocks.atualizarTentativa).not.toHaveBeenCalled();
    });
  });

  // ─── deletarTentativa ───────────────────────────────────────────────────────

  describe("deletarTentativa", () => {
    it("retorna 200 com mensagem e tentativa removida", async () => {
      formularioServiceMocks.deletarTentativa.mockResolvedValue({ id: 1, formulario_id: 2, usuario_id: 10 });

      const res = criarRes();
      await controller.deletarTentativa(criarReq({ params: { id: "1" }, usuario: usuarioAluno } as any), res);

      expect(res.statusCode).toBe(200);
      expect((res.body as any).message).toContain("removida");
    });

    it("retorna 404 para P2025", async () => {
      formularioServiceMocks.deletarTentativa.mockRejectedValue(p2025());

      const res = criarRes();
      await controller.deletarTentativa(criarReq({ params: { id: "999" } }), res);

      expect(res.statusCode).toBe(404);
    });

    it("retorna 403 para acesso negado", async () => {
      formularioServiceMocks.deletarTentativa.mockRejectedValue(new Error("Acesso negado a esta tentativa."));

      const res = criarRes();
      await controller.deletarTentativa(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(403);
    });

    it("retorna 400 para ID invalido (NaN)", async () => {
      const res = criarRes();
      await controller.deletarTentativa(criarReq({ params: { id: "abc" } }), res);

      expect(res.statusCode).toBe(400);
      expect(formularioServiceMocks.deletarTentativa).not.toHaveBeenCalled();
    });
  });
});
