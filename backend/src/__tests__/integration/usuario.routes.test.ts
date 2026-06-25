/**
 * Testes de integração — /usuarios
 *
 * Estratégia:
 *  - Prisma mockado apenas em sessao.findFirst (authMiddleware).
 *  - UsuarioService mockado para isolar regras de negócio.
 *  - Foco: todas as rotas exigem auth + cargo ADMIN.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { Prisma } from "@prisma/client";

const prismaMock = vi.hoisted(() => ({
  sessaoFindFirst: vi.fn(),
}));

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

vi.mock("../../config/prisma", () => ({
  prisma: { sessao: { findFirst: prismaMock.sessaoFindFirst } },
}));

vi.mock("../../modules/Usuario/usuario.service", () => ({
  UsuarioService: vi.fn(() => usuarioServiceMocks),
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

const usuarioBase = {
  id: 2,
  nome: "Aluno Teste",
  email: "aluno@test.local",
  cargo: "ALUNO",
  ativo: true,
  criado_em: new Date().toISOString(),
  ordem_id: null,
  ordem: null,
};

function p2025() {
  return new Prisma.PrismaClientKnownRequestError("Record not found", {
    code: "P2025",
    clientVersion: "4.16",
  });
}

describe("Usuario Routes — Integração", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.sessaoFindFirst.mockResolvedValue(adminSessao);
  });

  // ─── Bloqueio global: auth + ADMIN ──────────────────────────────────────────

  describe("Bloqueio de acesso", () => {
    it("401 em GET /usuarios sem token", async () => {
      await request(app).get("/usuarios").expect(401);
    });

    it("403 em GET /usuarios para ALUNO", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);

      await request(app)
        .get("/usuarios")
        .set("Authorization", "Bearer aluno-token")
        .expect(403);
    });
  });

  // ─── POST /usuarios ─────────────────────────────────────────────────────────

  describe("POST /usuarios", () => {
    it("201 ao criar usuario", async () => {
      usuarioServiceMocks.create.mockResolvedValue(usuarioBase);

      await request(app)
        .post("/usuarios")
        .set("Authorization", "Bearer admin-token")
        .send({ nome: "Novo", email: "novo@test.local", senha: "SenhaForte1!", cargo: "ALUNO" })
        .expect(201);
    });

    it("400 para e-mail duplicado", async () => {
      usuarioServiceMocks.create.mockRejectedValue({ code: "P2002", meta: { target: ["email"] } });

      await request(app)
        .post("/usuarios")
        .set("Authorization", "Bearer admin-token")
        .send({ nome: "X", email: "existente@test.local", senha: "SenhaForte1!", cargo: "ALUNO" })
        .expect(400)
        .expect((res) => {
          expect(res.body.error).toContain("cadastrado");
        });
    });
  });

  // ─── GET /usuarios ──────────────────────────────────────────────────────────

  describe("GET /usuarios", () => {
    it("200 com lista de usuarios", async () => {
      usuarioServiceMocks.getAll.mockResolvedValue([usuarioBase]);

      await request(app)
        .get("/usuarios")
        .set("Authorization", "Bearer admin-token")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  // ─── GET /usuarios/:id ──────────────────────────────────────────────────────

  describe("GET /usuarios/:id", () => {
    it("200 para usuario existente", async () => {
      usuarioServiceMocks.getById.mockResolvedValue(usuarioBase);

      await request(app)
        .get("/usuarios/2")
        .set("Authorization", "Bearer admin-token")
        .expect(200);
    });

    it("404 para usuario inexistente", async () => {
      usuarioServiceMocks.getById.mockResolvedValue(null);

      await request(app)
        .get("/usuarios/999")
        .set("Authorization", "Bearer admin-token")
        .expect(404);
    });
  });

  // ─── PATCH /usuarios/:id/ativar e /desativar ────────────────────────────────

  describe("PATCH /usuarios/:id/ativar", () => {
    it("200 ao ativar usuario existente", async () => {
      usuarioServiceMocks.setActive.mockResolvedValue({ ...usuarioBase, ativo: true });

      await request(app)
        .patch("/usuarios/2/ativar")
        .set("Authorization", "Bearer admin-token")
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain("ativado");
        });
    });

    it("404 para usuario inexistente (P2025)", async () => {
      usuarioServiceMocks.setActive.mockRejectedValue(p2025());

      await request(app)
        .patch("/usuarios/999/ativar")
        .set("Authorization", "Bearer admin-token")
        .expect(404);
    });
  });

  describe("PATCH /usuarios/:id/desativar", () => {
    it("200 ao desativar usuario", async () => {
      usuarioServiceMocks.setActive.mockResolvedValue({ ...usuarioBase, ativo: false });

      await request(app)
        .patch("/usuarios/2/desativar")
        .set("Authorization", "Bearer admin-token")
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain("desativado");
        });
    });
  });

  // ─── POST /usuarios/:id/gerar-link-reset ────────────────────────────────────

  describe("POST /usuarios/:id/gerar-link-reset", () => {
    it("200 com link de reset", async () => {
      usuarioServiceMocks.gerarLinkReset.mockResolvedValue({
        link: "http://localhost/reset-password?token=abc",
        expira_em: new Date(),
      });

      await request(app)
        .post("/usuarios/2/gerar-link-reset")
        .set("Authorization", "Bearer admin-token")
        .expect(200)
        .expect((res) => {
          expect(res.body.link).toContain("/reset-password?token=");
        });
    });

    it("404 para usuario inexistente", async () => {
      usuarioServiceMocks.gerarLinkReset.mockRejectedValue(new Error("Usuário não encontrado."));

      await request(app)
        .post("/usuarios/999/gerar-link-reset")
        .set("Authorization", "Bearer admin-token")
        .expect(404);
    });
  });

  // ─── PATCH /usuarios/:id/desbloquear ────────────────────────────────────────

  describe("PATCH /usuarios/:id/desbloquear", () => {
    it("200 ao desbloquear usuario", async () => {
      usuarioServiceMocks.desbloquear.mockResolvedValue(usuarioBase);

      await request(app)
        .patch("/usuarios/2/desbloquear")
        .set("Authorization", "Bearer admin-token")
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain("desbloqueado");
        });
    });
  });

  // ─── DELETE /usuarios/:id ───────────────────────────────────────────────────

  describe("DELETE /usuarios/:id", () => {
    it("200 ao remover usuario", async () => {
      usuarioServiceMocks.delete.mockResolvedValue({ id: 2, nome: "Aluno", email: "aluno@test.local" });

      await request(app)
        .delete("/usuarios/2")
        .set("Authorization", "Bearer admin-token")
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain("deletado");
        });
    });
  });
});
