/**
 * Testes de integração — /auth
 *
 * Estratégia:
 *  - Prisma mockado apenas em sessao.findFirst (usado pelo authMiddleware).
 *  - AuthService mockado na totalidade para isolar lógica de negócio.
 *  - Foco: configuração das rotas, enforcement de auth/roles, mapeamento HTTP.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const prismaMock = vi.hoisted(() => ({
  sessaoFindFirst: vi.fn(),
}));

const authServiceMocks = vi.hoisted(() => ({
  cadastro: vi.fn(),
  login: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  criarConvite: vi.fn(),
  validarConvite: vi.fn(),
  registrarComConvite: vi.fn(),
}));

vi.mock("../../config/prisma", () => ({
  prisma: { sessao: { findFirst: prismaMock.sessaoFindFirst } },
}));

vi.mock("../../modules/Auth/auth.service", () => ({
  AuthService: vi.fn(() => authServiceMocks),
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

describe("Auth Routes — Integração", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.sessaoFindFirst.mockResolvedValue(adminSessao);
  });

  // ─── POST /auth/cadastro (público) ──────────────────────────────────────────

  describe("POST /auth/cadastro", () => {
    it("201 no sucesso", async () => {
      authServiceMocks.cadastro.mockResolvedValue({ token: "tok", usuario: { id: 1 } });

      await request(app)
        .post("/auth/cadastro")
        .send({ nome: "X", email: "x@test.local", senha: "SenhaForte1!" })
        .expect(201)
        .expect((res) => {
          expect(res.body.token).toBe("tok");
        });
    });

    it("400 para e-mail duplicado (P2002)", async () => {
      authServiceMocks.cadastro.mockRejectedValue({ code: "P2002", meta: { target: ["email"] } });

      await request(app)
        .post("/auth/cadastro")
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.error).toBe("E-mail ja cadastrado.");
        });
    });
  });

  // ─── POST /auth/login (público) ─────────────────────────────────────────────

  describe("POST /auth/login", () => {
    it("200 no sucesso", async () => {
      authServiceMocks.login.mockResolvedValue({ token: "tok", usuario: { id: 1 } });

      await request(app)
        .post("/auth/login")
        .send({ email: "x@test.local", senha: "SenhaForte1!" })
        .expect(200);
    });

    it("401 para credenciais invalidas", async () => {
      authServiceMocks.login.mockRejectedValue(new Error("Credenciais invalidas."));

      await request(app)
        .post("/auth/login")
        .send({ email: "x@test.local", senha: "errada" })
        .expect(401);
    });

    it("400 para conta bloqueada", async () => {
      authServiceMocks.login.mockRejectedValue(new Error("Conta temporariamente bloqueada."));

      await request(app)
        .post("/auth/login")
        .send({ email: "x@test.local", senha: "errada" })
        .expect(400);
    });
  });

  // ─── GET /auth/me (protegido) ───────────────────────────────────────────────

  describe("GET /auth/me", () => {
    it("401 sem Authorization header", async () => {
      await request(app).get("/auth/me").expect(401);
    });

    it("401 para token invalido", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(null);

      await request(app)
        .get("/auth/me")
        .set("Authorization", "Bearer token-invalido")
        .expect(401);
    });

    it("401 para token expirado", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue({
        ...adminSessao,
        expira_em: new Date("2020-01-01"),
      });

      await request(app)
        .get("/auth/me")
        .set("Authorization", "Bearer token-expirado")
        .expect(401);
    });

    it("200 com sessao valida — retorna dados do usuario", async () => {
      await request(app)
        .get("/auth/me")
        .set("Authorization", "Bearer token-admin")
        .expect(200)
        .expect((res) => {
          expect(res.body.usuario.cargo).toBe("ADMIN");
        });
    });
  });

  // ─── POST /auth/convite (ADMIN only) ────────────────────────────────────────

  describe("POST /auth/convite", () => {
    it("401 sem token", async () => {
      await request(app)
        .post("/auth/convite")
        .send({ email: "novo@test.local" })
        .expect(401);
    });

    it("403 para ALUNO autenticado", async () => {
      prismaMock.sessaoFindFirst.mockResolvedValue(alunoSessao);

      await request(app)
        .post("/auth/convite")
        .set("Authorization", "Bearer aluno-token")
        .send({ email: "novo@test.local" })
        .expect(403);
    });

    it("201 para ADMIN autenticado", async () => {
      authServiceMocks.criarConvite.mockResolvedValue({
        link: "http://localhost/register?token=abc",
        expira_em: new Date(),
        cargo: "ALUNO",
      });

      await request(app)
        .post("/auth/convite")
        .set("Authorization", "Bearer admin-token")
        .send({ email: "novo@test.local" })
        .expect(201);
    });
  });

  // ─── GET /auth/convite/:token (público) ─────────────────────────────────────

  describe("GET /auth/convite/:token", () => {
    it("200 para convite valido", async () => {
      authServiceMocks.validarConvite.mockResolvedValue({ email: "x@test.local", cargo: "ALUNO", expira_em: new Date() });

      await request(app)
        .get("/auth/convite/abc123")
        .expect(200)
        .expect((res) => {
          expect(res.body.cargo).toBe("ALUNO");
        });
    });

    it("400 para convite invalido ou expirado", async () => {
      authServiceMocks.validarConvite.mockRejectedValue(new Error("Convite inválido ou expirado."));

      await request(app)
        .get("/auth/convite/invalido")
        .expect(400);
    });
  });

  // ─── POST /auth/registrar (público) ─────────────────────────────────────────

  describe("POST /auth/registrar", () => {
    it("201 ao registrar com convite valido", async () => {
      authServiceMocks.registrarComConvite.mockResolvedValue({ token: "tok", usuario: { id: 20 } });

      await request(app)
        .post("/auth/registrar")
        .send({ token: "abc", nome: "Novo", email: "novo@test.local", senha: "SenhaForte1!" })
        .expect(201);
    });

    it("400 para convite invalido", async () => {
      authServiceMocks.registrarComConvite.mockRejectedValue(new Error("Convite inválido ou expirado."));

      await request(app)
        .post("/auth/registrar")
        .send({ token: "invalido" })
        .expect(400);
    });
  });

  // ─── POST /auth/forgot-password (público) ───────────────────────────────────

  describe("POST /auth/forgot-password", () => {
    it("200 com mensagem generica independente do e-mail", async () => {
      authServiceMocks.forgotPassword.mockResolvedValue({ message: "Se o e-mail estiver cadastrado..." });

      await request(app)
        .post("/auth/forgot-password")
        .send({ email: "qualquer@test.local" })
        .expect(200);
    });
  });

  // ─── POST /auth/reset-password (público) ────────────────────────────────────

  describe("POST /auth/reset-password", () => {
    it("200 no sucesso", async () => {
      authServiceMocks.resetPassword.mockResolvedValue({ message: "Senha redefinida com sucesso." });

      await request(app)
        .post("/auth/reset-password")
        .send({ token: "abc", nova_senha: "NovaSenha1!" })
        .expect(200);
    });

    it("400 para token expirado", async () => {
      authServiceMocks.resetPassword.mockRejectedValue(new Error("Token invalido ou expirado."));

      await request(app)
        .post("/auth/reset-password")
        .send({ token: "expirado" })
        .expect(400);
    });
  });
});
