/**
 * Testes de integração — /comunicados
 *
 * Estratégia:
 *  - Prisma mockado apenas em sessao.findFirst (authMiddleware).
 *  - ComunicadoService mockado para isolar regras de negócio.
 *  - Foco: autenticação obrigatória, escrita restrita a ADMIN, mapeamento HTTP.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { Prisma } from "@prisma/client";

const prismaMock = vi.hoisted(() => ({
  sessaoFindFirst: vi.fn(),
}));

const comunicadoServiceMocks = vi.hoisted(() => ({
  create: vi.fn(),
  getAll: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../../config/prisma", () => ({
  prisma: { sessao: { findFirst: prismaMock.sessaoFindFirst } },
}));

vi.mock("../../modules/Comunicado/comunicado.service", () => ({
  ComunicadoService: vi.fn(() => comunicadoServiceMocks),
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

const comunicadoBase = {
  id: 1,
  titulo: "Aviso de Emergência",
  conteudo: "Evacuação da área X",
  publicado_em: new Date("2026-01-01").toISOString(),
  atualizado_em: new Date("2026-01-01").toISOString(),
  autor: { id: 1, nome: "Admin" },
};

describe("Comunicado Routes — Integração", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.sessaoFindFirst.mockResolvedValue(adminSessao);
  });

  // ─── GET /comunicados (leitura: qualquer autenticado) ───────────────────────

  describe("GET /comunicados", () => {
    it("401 sem token", async () => {
      await request(app).get("/comunicados").expect(401);
    });

    it("200 para ALUNO autenticado", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      comunicadoServiceMocks.getAll.mockResolvedValue([comunicadoBase]);

      await request(app)
        .get("/comunicados")
        .set("Authorization", "Bearer aluno-token")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it("200 para ADMIN autenticado", async () => {
      comunicadoServiceMocks.getAll.mockResolvedValue([comunicadoBase]);

      await request(app)
        .get("/comunicados")
        .set("Authorization", "Bearer admin-token")
        .expect(200);
    });
  });

  // ─── GET /comunicados/:id ────────────────────────────────────────────────────

  describe("GET /comunicados/:id", () => {
    it("401 sem token", async () => {
      await request(app).get("/comunicados/1").expect(401);
    });

    it("200 para comunicado existente", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      comunicadoServiceMocks.getById.mockResolvedValue(comunicadoBase);

      await request(app)
        .get("/comunicados/1")
        .set("Authorization", "Bearer aluno-token")
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(1);
        });
    });

    it("404 para comunicado inexistente", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);
      comunicadoServiceMocks.getById.mockResolvedValue(null);

      await request(app)
        .get("/comunicados/999")
        .set("Authorization", "Bearer aluno-token")
        .expect(404);
    });
  });

  // ─── POST /comunicados (escrita: somente ADMIN) ──────────────────────────────

  describe("POST /comunicados", () => {
    it("401 sem token", async () => {
      await request(app)
        .post("/comunicados")
        .send({ titulo: "X", conteudo: "Y" })
        .expect(401);
    });

    it("403 para ALUNO autenticado", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);

      await request(app)
        .post("/comunicados")
        .set("Authorization", "Bearer aluno-token")
        .send({ titulo: "X", conteudo: "Y" })
        .expect(403);
    });

    it("201 para ADMIN autenticado", async () => {
      comunicadoServiceMocks.create.mockResolvedValue(comunicadoBase);

      await request(app)
        .post("/comunicados")
        .set("Authorization", "Bearer admin-token")
        .send({ titulo: "Aviso de Emergência", conteudo: "Evacuação da área X" })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBe(1);
        });
    });

    it("400 para campos obrigatorios ausentes", async () => {
      comunicadoServiceMocks.create.mockRejectedValue(new Error("Os campos 'titulo' e 'conteudo' sao obrigatorios."));

      await request(app)
        .post("/comunicados")
        .set("Authorization", "Bearer admin-token")
        .send({ titulo: "" })
        .expect(400);
    });
  });

  // ─── PUT /comunicados/:id (somente ADMIN) ───────────────────────────────────

  describe("PUT /comunicados/:id", () => {
    it("403 para ALUNO", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);

      await request(app)
        .put("/comunicados/1")
        .set("Authorization", "Bearer aluno-token")
        .send({ titulo: "X" })
        .expect(403);
    });

    it("200 para ADMIN com update valido", async () => {
      comunicadoServiceMocks.update.mockResolvedValue({ ...comunicadoBase, titulo: "Novo titulo" });

      await request(app)
        .put("/comunicados/1")
        .set("Authorization", "Bearer admin-token")
        .send({ titulo: "Novo titulo" })
        .expect(200);
    });

    it("404 para comunicado inexistente (P2025)", async () => {
      comunicadoServiceMocks.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("not found", { code: "P2025", clientVersion: "4.16" })
      );

      await request(app)
        .put("/comunicados/999")
        .set("Authorization", "Bearer admin-token")
        .send({ titulo: "X" })
        .expect(404);
    });
  });

  // ─── DELETE /comunicados/:id (somente ADMIN) ────────────────────────────────

  describe("DELETE /comunicados/:id", () => {
    it("403 para ALUNO", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);

      await request(app)
        .delete("/comunicados/1")
        .set("Authorization", "Bearer aluno-token")
        .expect(403);
    });

    it("200 para ADMIN", async () => {
      comunicadoServiceMocks.delete.mockResolvedValue({ id: 1, titulo: "Aviso" });

      await request(app)
        .delete("/comunicados/1")
        .set("Authorization", "Bearer admin-token")
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain("deletado");
        });
    });

    it("404 para comunicado inexistente (P2025)", async () => {
      comunicadoServiceMocks.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("not found", { code: "P2025", clientVersion: "4.16" })
      );

      await request(app)
        .delete("/comunicados/999")
        .set("Authorization", "Bearer admin-token")
        .expect(404);
    });
  });
});
