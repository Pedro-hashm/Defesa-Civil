import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

const usuarioServiceMocks = vi.hoisted(() => ({
  create: vi.fn(),
  getAll: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  setActive: vi.fn(),
  delete: vi.fn(),
  gerarLinkReset: vi.fn(),
  desbloquear: vi.fn(),
}));

vi.mock("./usuario.service", () => ({
  UsuarioService: vi.fn(() => usuarioServiceMocks),
}));

import { UsuarioController } from "./usuario.controller";

const usuarioBase = {
  id: 1,
  nome: "Aluno Teste",
  email: "aluno@test.local",
  cargo: "ALUNO",
  ativo: true,
  criado_em: new Date("2026-01-01"),
  ordem_id: null,
  ordem: null,
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

describe("UsuarioController", () => {
  const controller = new UsuarioController();

  beforeEach(() => vi.clearAllMocks());

  // ─── criar ──────────────────────────────────────────────────────────────────

  describe("criar", () => {
    it("retorna 201 no sucesso", async () => {
      usuarioServiceMocks.create.mockResolvedValue(usuarioBase);

      const res = criarRes();
      await controller.criar(criarReq({ body: { nome: "X", email: "x@test.local", senha: "S1!", cargo: "ALUNO" } }), res);

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(usuarioBase);
    });

    it("retorna 400 para e-mail duplicado (P2002)", async () => {
      usuarioServiceMocks.create.mockRejectedValue({ code: "P2002", meta: { target: ["email"] } });

      const res = criarRes();
      await controller.criar(criarReq(), res);

      expect(res.statusCode).toBe(400);
      expect((res.body as any).error).toBe("E-mail já cadastrado.");
    });

    it("retorna 400 para erro generico", async () => {
      usuarioServiceMocks.create.mockRejectedValue(new Error("O campo 'cargo' é obrigatório."));

      const res = criarRes();
      await controller.criar(criarReq(), res);

      expect(res.statusCode).toBe(400);
      expect((res.body as any).error).toContain("cargo");
    });
  });

  // ─── listar ─────────────────────────────────────────────────────────────────

  describe("listar", () => {
    it("retorna 200 com lista de usuarios", async () => {
      usuarioServiceMocks.getAll.mockResolvedValue([usuarioBase]);

      const res = criarRes();
      await controller.listar(criarReq(), res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([usuarioBase]);
    });
  });

  // ─── buscar ─────────────────────────────────────────────────────────────────

  describe("buscar", () => {
    it("retorna 200 quando usuario existe", async () => {
      usuarioServiceMocks.getById.mockResolvedValue(usuarioBase);

      const res = criarRes();
      await controller.buscar(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(200);
      expect((res.body as any).id).toBe(1);
    });

    it("retorna 404 quando usuario nao existe", async () => {
      usuarioServiceMocks.getById.mockResolvedValue(null);

      const res = criarRes();
      await controller.buscar(criarReq({ params: { id: "999" } }), res);

      expect(res.statusCode).toBe(404);
      expect((res.body as any).error).toContain("não encontrado");
    });
  });

  // ─── atualizar ──────────────────────────────────────────────────────────────

  describe("atualizar", () => {
    it("retorna 200 com usuario atualizado", async () => {
      usuarioServiceMocks.update.mockResolvedValue({ ...usuarioBase, nome: "Novo Nome" });

      const res = criarRes();
      await controller.atualizar(criarReq({ params: { id: "1" }, body: { nome: "Novo Nome" } }), res);

      expect(res.statusCode).toBe(200);
      expect((res.body as any).nome).toBe("Novo Nome");
    });

    it("retorna 400 para erro de validacao", async () => {
      usuarioServiceMocks.update.mockRejectedValue(new Error("Cargo inválido."));

      const res = criarRes();
      await controller.atualizar(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── ativar / desativar ──────────────────────────────────────────────────────

  describe("ativar", () => {
    it("retorna 200 ao ativar usuario", async () => {
      usuarioServiceMocks.setActive.mockResolvedValue({ ...usuarioBase, ativo: true });

      const res = criarRes();
      await controller.ativar(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(200);
      expect((res.body as any).message).toContain("ativado");
    });

    it("retorna 404 quando usuario nao encontrado (P2025)", async () => {
      usuarioServiceMocks.setActive.mockRejectedValue(p2025());

      const res = criarRes();
      await controller.ativar(criarReq({ params: { id: "999" } }), res);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("desativar", () => {
    it("retorna 200 ao desativar usuario", async () => {
      usuarioServiceMocks.setActive.mockResolvedValue({ ...usuarioBase, ativo: false });

      const res = criarRes();
      await controller.desativar(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(200);
      expect((res.body as any).message).toContain("desativado");
    });

    it("retorna 404 para P2025", async () => {
      usuarioServiceMocks.setActive.mockRejectedValue(p2025());

      const res = criarRes();
      await controller.desativar(criarReq({ params: { id: "999" } }), res);

      expect(res.statusCode).toBe(404);
    });
  });

  // ─── deletar ────────────────────────────────────────────────────────────────

  describe("deletar", () => {
    it("retorna 200 com mensagem e usuario removido", async () => {
      usuarioServiceMocks.delete.mockResolvedValue({ id: 1, nome: "Aluno", email: "aluno@test.local" });

      const res = criarRes();
      await controller.deletar(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(200);
      expect((res.body as any).message).toContain("deletado");
    });

    it("retorna 400 para erro", async () => {
      usuarioServiceMocks.delete.mockRejectedValue(new Error("Erro ao deletar"));

      const res = criarRes();
      await controller.deletar(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── gerarLinkReset ─────────────────────────────────────────────────────────

  describe("gerarLinkReset", () => {
    it("retorna 200 com link e expiracao", async () => {
      usuarioServiceMocks.gerarLinkReset.mockResolvedValue({
        link: "http://localhost:3000/reset-password?token=abc",
        expira_em: new Date(),
      });

      const res = criarRes();
      await controller.gerarLinkReset(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(200);
      expect((res.body as any).link).toContain("/reset-password?token=");
    });

    it("retorna 404 para P2025", async () => {
      usuarioServiceMocks.gerarLinkReset.mockRejectedValue(p2025());

      const res = criarRes();
      await controller.gerarLinkReset(criarReq({ params: { id: "999" } }), res);

      expect(res.statusCode).toBe(404);
    });

    it("retorna 404 para message 'Usuário não encontrado.'", async () => {
      usuarioServiceMocks.gerarLinkReset.mockRejectedValue(new Error("Usuário não encontrado."));

      const res = criarRes();
      await controller.gerarLinkReset(criarReq({ params: { id: "999" } }), res);

      expect(res.statusCode).toBe(404);
    });
  });

  // ─── desbloquear ────────────────────────────────────────────────────────────

  describe("desbloquear", () => {
    it("retorna 200 com mensagem e usuario", async () => {
      usuarioServiceMocks.desbloquear.mockResolvedValue(usuarioBase);

      const res = criarRes();
      await controller.desbloquear(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(200);
      expect((res.body as any).message).toContain("desbloqueado");
    });

    it("retorna 404 para P2025", async () => {
      usuarioServiceMocks.desbloquear.mockRejectedValue(p2025());

      const res = criarRes();
      await controller.desbloquear(criarReq({ params: { id: "999" } }), res);

      expect(res.statusCode).toBe(404);
    });

    it("retorna 400 para outros erros", async () => {
      usuarioServiceMocks.desbloquear.mockRejectedValue(new Error("Erro inesperado"));

      const res = criarRes();
      await controller.desbloquear(criarReq({ params: { id: "1" } }), res);

      expect(res.statusCode).toBe(400);
    });
  });
});
