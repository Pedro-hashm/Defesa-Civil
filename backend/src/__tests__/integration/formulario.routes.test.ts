/**
 * Testes de integração — /formularios e /tentativas
 *
 * Estratégia:
 *  - Prisma mockado apenas em sessao.findFirst (authMiddleware).
 *  - FormularioService mockado para isolar regras de negócio.
 *  - Foco: auth obrigatório, criação de tentativa restrita a ALUNO,
 *           visão supervisor restrita a ADMIN, controle de acesso por dono.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { Prisma, StatusTentativa } from "@prisma/client";

const prismaMock = vi.hoisted(() => ({
  sessaoFindFirst: vi.fn(),
}));

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

vi.mock("../../config/prisma", () => ({
  prisma: { sessao: { findFirst: prismaMock.sessaoFindFirst } },
}));

vi.mock("../../modules/Formulario/formulario.service", () => ({
  FormularioService: vi.fn(() => formularioServiceMocks),
}));

import { createApp } from "../helpers/create-app";

const app = createApp();

const adminSessao = {
  expira_em: new Date(Date.now() + 86_400_000),
  usuario: { id: 1, nome: "Admin", email: "admin@test.local", cargo: "ADMIN", ativo: true, criado_em: new Date() },
};

const alunoSessao = {
  expira_em: new Date(Date.now() + 86_400_000),
  usuario: { id: 10, nome: "Aluno", email: "aluno@test.local", cargo: "ALUNO", ativo: true, criado_em: new Date() },
};

const formularioBase = { id: 2, titulo: "FIDE", descricao: "desc", ativo: true, criado_em: new Date().toISOString() };

const tentativaBase = {
  id: 1,
  usuario_id: 10,
  formulario_id: 2,
  respostas: { uf: "PE" },
  erros: null,
  status: StatusTentativa.FINALIZADO,
  iniciado_em: new Date().toISOString(),
  finalizado_em: new Date().toISOString(),
  usuario: { id: 10, nome: "Aluno", email: "aluno@test.local", cargo: "ALUNO" },
  formulario: { id: 2, titulo: "FIDE", descricao: "desc" },
};

function p2025() {
  return new Prisma.PrismaClientKnownRequestError("Record not found", {
    code: "P2025",
    clientVersion: "4.16",
  });
}

describe("Formulario Routes — Integração", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.sessaoFindFirst.mockResolvedValue(adminSessao);
  });

  // ─── GET /formularios ───────────────────────────────────────────────────────

  describe("GET /formularios", () => {
    it("401 sem token", async () => {
      await request(app).get("/formularios").expect(401);
    });

    it("200 para usuario autenticado", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      formularioServiceMocks.listarFormularios.mockResolvedValue([formularioBase]);

      await request(app)
        .get("/formularios")
        .set("Authorization", "Bearer aluno-token")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  // ─── GET /formularios/:id ───────────────────────────────────────────────────

  describe("GET /formularios/:id", () => {
    it("200 para formulario existente", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      formularioServiceMocks.buscarFormulario.mockResolvedValue({ ...formularioBase, estrutura: {} });

      await request(app)
        .get("/formularios/2")
        .set("Authorization", "Bearer aluno-token")
        .expect(200);
    });

    it("404 para formulario inexistente", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      formularioServiceMocks.buscarFormulario.mockResolvedValue(null);

      await request(app)
        .get("/formularios/999")
        .set("Authorization", "Bearer aluno-token")
        .expect(404);
    });

    it("400 para ID invalido", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);

      await request(app)
        .get("/formularios/abc")
        .set("Authorization", "Bearer aluno-token")
        .expect(400);
    });
  });

  // ─── POST /tentativas (somente ALUNO) ───────────────────────────────────────

  describe("POST /tentativas", () => {
    it("401 sem token", async () => {
      await request(app)
        .post("/tentativas")
        .send({ formulario_id: 2, respostas: {} })
        .expect(401);
    });

    it("403 para ADMIN tentar criar tentativa", async () => {
      await request(app)
        .post("/tentativas")
        .set("Authorization", "Bearer admin-token")
        .send({ formulario_id: 2, respostas: {} })
        .expect(403);
    });

    it("201 para ALUNO criando tentativa", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      formularioServiceMocks.criarTentativa.mockResolvedValue(tentativaBase);

      await request(app)
        .post("/tentativas")
        .set("Authorization", "Bearer aluno-token")
        .send({ formulario_id: 2, respostas: { uf: "PE" } })
        .expect(201);
    });

    it("400 para formulario inativo", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      formularioServiceMocks.criarTentativa.mockRejectedValue(new Error("Formulario nao encontrado ou inativo."));

      await request(app)
        .post("/tentativas")
        .set("Authorization", "Bearer aluno-token")
        .send({ formulario_id: 99, respostas: {} })
        .expect(400);
    });
  });

  // ─── GET /tentativas ────────────────────────────────────────────────────────

  describe("GET /tentativas", () => {
    it("401 sem token", async () => {
      await request(app).get("/tentativas").expect(401);
    });

    it("200 para ALUNO — filtra proprias tentativas", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      formularioServiceMocks.listarTentativas.mockResolvedValue([tentativaBase]);

      await request(app)
        .get("/tentativas")
        .set("Authorization", "Bearer aluno-token")
        .expect(200);

      expect(formularioServiceMocks.listarTentativas).toHaveBeenCalledWith(10, "ALUNO");
    });

    it("200 para ADMIN — lista todas", async () => {
      formularioServiceMocks.listarTentativas.mockResolvedValue([tentativaBase]);

      await request(app)
        .get("/tentativas")
        .set("Authorization", "Bearer admin-token")
        .expect(200);

      expect(formularioServiceMocks.listarTentativas).toHaveBeenCalledWith(1, "ADMIN");
    });
  });

  // ─── GET /tentativas/supervisor (somente ADMIN) ──────────────────────────────

  describe("GET /tentativas/supervisor", () => {
    it("401 sem token", async () => {
      await request(app).get("/tentativas/supervisor").expect(401);
    });

    it("403 para ALUNO", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);

      await request(app)
        .get("/tentativas/supervisor")
        .set("Authorization", "Bearer aluno-token")
        .expect(403);
    });

    it("200 para ADMIN", async () => {
      formularioServiceMocks.listarTentativasSupervisor.mockResolvedValue([tentativaBase]);

      await request(app)
        .get("/tentativas/supervisor")
        .set("Authorization", "Bearer admin-token")
        .expect(200);
    });
  });

  // ─── GET /tentativas/:id ────────────────────────────────────────────────────

  describe("GET /tentativas/:id", () => {
    it("200 para dono da tentativa", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      formularioServiceMocks.buscarTentativa.mockResolvedValue(tentativaBase);

      await request(app)
        .get("/tentativas/1")
        .set("Authorization", "Bearer aluno-token")
        .expect(200);
    });

    it("404 para tentativa inexistente", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      formularioServiceMocks.buscarTentativa.mockResolvedValue(null);

      await request(app)
        .get("/tentativas/999")
        .set("Authorization", "Bearer aluno-token")
        .expect(404);
    });

    it("403 para acesso negado (nao e o dono)", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      formularioServiceMocks.buscarTentativa.mockRejectedValue(new Error("Acesso negado a esta tentativa."));

      await request(app)
        .get("/tentativas/1")
        .set("Authorization", "Bearer aluno-token")
        .expect(403);
    });
  });

  // ─── PUT /tentativas/:id ────────────────────────────────────────────────────

  describe("PUT /tentativas/:id", () => {
    it("200 ao atualizar tentativa propria", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      formularioServiceMocks.atualizarTentativa.mockResolvedValue({ ...tentativaBase, respostas: { uf: "RJ" } });

      await request(app)
        .put("/tentativas/1")
        .set("Authorization", "Bearer aluno-token")
        .send({ respostas: { uf: "RJ" } })
        .expect(200);
    });

    it("404 para tentativa inexistente (P2025)", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      formularioServiceMocks.atualizarTentativa.mockRejectedValue(p2025());

      await request(app)
        .put("/tentativas/999")
        .set("Authorization", "Bearer aluno-token")
        .send({ respostas: {} })
        .expect(404);
    });

    it("403 para ALUNO tentando atualizar tentativa de outro", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      formularioServiceMocks.atualizarTentativa.mockRejectedValue(new Error("Acesso negado a esta tentativa."));

      await request(app)
        .put("/tentativas/1")
        .set("Authorization", "Bearer aluno-token")
        .send({ respostas: {} })
        .expect(403);
    });
  });

  // ─── DELETE /tentativas/:id ─────────────────────────────────────────────────

  describe("DELETE /tentativas/:id", () => {
    it("200 ao remover tentativa propria", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      formularioServiceMocks.deletarTentativa.mockResolvedValue({ id: 1, formulario_id: 2, usuario_id: 10 });

      await request(app)
        .delete("/tentativas/1")
        .set("Authorization", "Bearer aluno-token")
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain("removida");
        });
    });

    it("403 para tentativa de outro usuario", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      formularioServiceMocks.deletarTentativa.mockRejectedValue(new Error("Acesso negado a esta tentativa."));

      await request(app)
        .delete("/tentativas/1")
        .set("Authorization", "Bearer aluno-token")
        .expect(403);
    });

    it("404 para tentativa inexistente (P2025)", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      formularioServiceMocks.deletarTentativa.mockRejectedValue(p2025());

      await request(app)
        .delete("/tentativas/999")
        .set("Authorization", "Bearer aluno-token")
        .expect(404);
    });
  });
});
