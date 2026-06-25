/**
 * Testes de integração — /ordens
 *
 * Estratégia:
 *  - Prisma mockado apenas em sessao.findFirst (authMiddleware).
 *  - OrdemService mockado para isolar regras de negócio.
 *  - Foco: GET /ativas é autenticado (mas não exige ADMIN),
 *           demais rotas exigem auth + ADMIN.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const prismaMock = vi.hoisted(() => ({
  sessaoFindFirst: vi.fn(),
}));

const ordemServiceMocks = vi.hoisted(() => ({
  create: vi.fn(),
  getAll: vi.fn(),
  getAtivas: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../../config/prisma", () => ({
  prisma: { sessao: { findFirst: prismaMock.sessaoFindFirst } },
}));

vi.mock("../../modules/Ordem/ordem.service", () => ({
  OrdemService: vi.fn(() => ordemServiceMocks),
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

const ordemBase = {
  id: 1,
  nome: "Bombeiros",
  descricao: "Corpo de Bombeiros Municipal",
  ativo: true,
  criado_em: new Date().toISOString(),
};

describe("Ordem Routes — Integração", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.sessaoFindFirst.mockResolvedValue(adminSessao);
  });

  // ─── GET /ordens/ativas (auth, qualquer cargo) ───────────────────────────────

  describe("GET /ordens/ativas", () => {
    it("401 sem token", async () => {
      await request(app).get("/ordens/ativas").expect(401);
    });

    it("200 para ALUNO autenticado", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      ordemServiceMocks.getAtivas.mockResolvedValue([{ id: 1, nome: "Bombeiros", descricao: null }]);

      await request(app)
        .get("/ordens/ativas")
        .set("Authorization", "Bearer aluno-token")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it("200 para ADMIN autenticado", async () => {
      ordemServiceMocks.getAtivas.mockResolvedValue([{ id: 1, nome: "Bombeiros", descricao: null }]);

      await request(app)
        .get("/ordens/ativas")
        .set("Authorization", "Bearer admin-token")
        .expect(200);
    });
  });

  // ─── Bloqueio ADMIN nas demais rotas ────────────────────────────────────────

  describe("Bloqueio de acesso (ADMIN only)", () => {
    it("401 em GET /ordens sem token", async () => {
      await request(app).get("/ordens").expect(401);
    });

    it("403 em GET /ordens para ALUNO", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);

      await request(app)
        .get("/ordens")
        .set("Authorization", "Bearer aluno-token")
        .expect(403);
    });

    it("403 em POST /ordens para ALUNO", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);

      await request(app)
        .post("/ordens")
        .set("Authorization", "Bearer aluno-token")
        .send({ nome: "X" })
        .expect(403);
    });
  });

  // ─── POST /ordens ────────────────────────────────────────────────────────────

  describe("POST /ordens", () => {
    it("201 ao criar ordem", async () => {
      ordemServiceMocks.create.mockResolvedValue(ordemBase);

      await request(app)
        .post("/ordens")
        .set("Authorization", "Bearer admin-token")
        .send({ nome: "Bombeiros", descricao: "Corpo de Bombeiros Municipal" })
        .expect(201)
        .expect((res) => {
          expect(res.body.nome).toBe("Bombeiros");
        });
    });

    it("400 para nome duplicado (P2002)", async () => {
      ordemServiceMocks.create.mockRejectedValue({ code: "P2002" });

      await request(app)
        .post("/ordens")
        .set("Authorization", "Bearer admin-token")
        .send({ nome: "Bombeiros" })
        .expect(400)
        .expect((res) => {
          expect(res.body.error).toContain("Já existe");
        });
    });

    it("400 para nome vazio", async () => {
      ordemServiceMocks.create.mockRejectedValue(new Error("O campo 'nome' é obrigatório."));

      await request(app)
        .post("/ordens")
        .set("Authorization", "Bearer admin-token")
        .send({ nome: "   " })
        .expect(400);
    });
  });

  // ─── GET /ordens ─────────────────────────────────────────────────────────────

  describe("GET /ordens", () => {
    it("200 com lista de todas as ordens", async () => {
      ordemServiceMocks.getAll.mockResolvedValue([ordemBase]);

      await request(app)
        .get("/ordens")
        .set("Authorization", "Bearer admin-token")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body[0].nome).toBe("Bombeiros");
        });
    });
  });

  // ─── GET /ordens/:id ─────────────────────────────────────────────────────────

  describe("GET /ordens/:id", () => {
    it("200 para ordem existente", async () => {
      ordemServiceMocks.getById.mockResolvedValue(ordemBase);

      await request(app)
        .get("/ordens/1")
        .set("Authorization", "Bearer admin-token")
        .expect(200);
    });

    it("404 para ordem inexistente", async () => {
      ordemServiceMocks.getById.mockResolvedValue(null);

      await request(app)
        .get("/ordens/999")
        .set("Authorization", "Bearer admin-token")
        .expect(404);
    });
  });

  // ─── PUT /ordens/:id ─────────────────────────────────────────────────────────

  describe("PUT /ordens/:id", () => {
    it("200 ao atualizar ordem", async () => {
      ordemServiceMocks.update.mockResolvedValue({ ...ordemBase, nome: "Defesa Civil" });

      await request(app)
        .put("/ordens/1")
        .set("Authorization", "Bearer admin-token")
        .send({ nome: "Defesa Civil" })
        .expect(200)
        .expect((res) => {
          expect(res.body.nome).toBe("Defesa Civil");
        });
    });

    it("400 para nome duplicado (P2002)", async () => {
      ordemServiceMocks.update.mockRejectedValue({ code: "P2002" });

      await request(app)
        .put("/ordens/1")
        .set("Authorization", "Bearer admin-token")
        .send({ nome: "Bombeiros" })
        .expect(400);
    });
  });

  // ─── DELETE /ordens/:id ──────────────────────────────────────────────────────

  describe("DELETE /ordens/:id", () => {
    it("200 ao excluir ordem (desvincula usuarios antes)", async () => {
      ordemServiceMocks.delete.mockResolvedValue(ordemBase);

      await request(app)
        .delete("/ordens/1")
        .set("Authorization", "Bearer admin-token")
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain("excluída");
        });
    });

    it("400 para erro ao excluir", async () => {
      ordemServiceMocks.delete.mockRejectedValue(new Error("Erro ao excluir"));

      await request(app)
        .delete("/ordens/1")
        .set("Authorization", "Bearer admin-token")
        .expect(400);
    });
  });
});
