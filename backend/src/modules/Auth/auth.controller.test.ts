import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

const authServiceMocks = vi.hoisted(() => ({
  cadastro: vi.fn(),
  login: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  criarConvite: vi.fn(),
  validarConvite: vi.fn(),
  registrarComConvite: vi.fn(),
}));

vi.mock("./auth.service", () => ({
  AuthService: vi.fn(() => authServiceMocks),
}));

import { AuthController } from "./auth.controller";

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

describe("AuthController", () => {
  const controller = new AuthController();

  beforeEach(() => vi.clearAllMocks());

  // ─── cadastro ───────────────────────────────────────────────────────────────

  describe("cadastro", () => {
    it("retorna 201 no sucesso", async () => {
      const payload = { token: "tok", expira_em: new Date(), usuario: { id: 1, email: "x@test.local" } };
      authServiceMocks.cadastro.mockResolvedValue(payload);

      const res = criarRes();
      await controller.cadastro(criarReq({ body: { nome: "X", email: "x@test.local", senha: "S1!" } }), res);

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(payload);
    });

    it("retorna 400 para e-mail duplicado (P2002)", async () => {
      authServiceMocks.cadastro.mockRejectedValue({ code: "P2002", meta: { target: ["email"] } });

      const res = criarRes();
      await controller.cadastro(criarReq(), res);

      expect(res.statusCode).toBe(400);
      expect((res.body as any).error).toBe("E-mail ja cadastrado.");
    });

    it("retorna 400 para erro generico", async () => {
      authServiceMocks.cadastro.mockRejectedValue(new Error("Campos obrigatorios"));

      const res = criarRes();
      await controller.cadastro(criarReq(), res);

      expect(res.statusCode).toBe(400);
      expect((res.body as any).error).toContain("Campos obrigatorios");
    });
  });

  // ─── login ──────────────────────────────────────────────────────────────────

  describe("login", () => {
    it("retorna 200 no sucesso", async () => {
      authServiceMocks.login.mockResolvedValue({ token: "tok", usuario: { id: 1 } });

      const res = criarRes();
      await controller.login(criarReq({ body: { email: "a@b.com", senha: "S1!" } }), res);

      expect(res.statusCode).toBe(200);
      expect((res.body as any).token).toBe("tok");
    });

    it("retorna 401 para credenciais invalidas", async () => {
      authServiceMocks.login.mockRejectedValue(new Error("Credenciais invalidas."));

      const res = criarRes();
      await controller.login(criarReq(), res);

      expect(res.statusCode).toBe(401);
      expect((res.body as any).error).toBe("Credenciais invalidas.");
    });

    it("retorna 401 para usuario inativo", async () => {
      authServiceMocks.login.mockRejectedValue(new Error("Usuario inativo."));

      const res = criarRes();
      await controller.login(criarReq(), res);

      expect(res.statusCode).toBe(401);
    });

    it("retorna 400 para outros erros (bloqueio, recaptcha etc)", async () => {
      authServiceMocks.login.mockRejectedValue(new Error("Conta temporariamente bloqueada."));

      const res = criarRes();
      await controller.login(criarReq(), res);

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── me ─────────────────────────────────────────────────────────────────────

  describe("me", () => {
    it("retorna 200 com usuario do request", async () => {
      const usuario = { id: 7, nome: "Admin", email: "admin@test.local", cargo: "ADMIN" };
      const req = criarReq({ usuario } as any);
      const res = criarRes();

      await controller.me(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ usuario });
    });
  });

  // ─── forgotPassword ─────────────────────────────────────────────────────────

  describe("forgotPassword", () => {
    it("retorna 200 com mensagem generica", async () => {
      authServiceMocks.forgotPassword.mockResolvedValue({ message: "Se o e-mail estiver cadastrado..." });

      const res = criarRes();
      await controller.forgotPassword(criarReq({ body: { email: "x@test.local" } }), res);

      expect(res.statusCode).toBe(200);
    });

    it("retorna 400 para erro inesperado", async () => {
      authServiceMocks.forgotPassword.mockRejectedValue(new Error("Erro interno"));

      const res = criarRes();
      await controller.forgotPassword(criarReq(), res);

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── resetPassword ──────────────────────────────────────────────────────────

  describe("resetPassword", () => {
    it("retorna 200 no sucesso", async () => {
      authServiceMocks.resetPassword.mockResolvedValue({ message: "Senha redefinida com sucesso." });

      const res = criarRes();
      await controller.resetPassword(criarReq({ body: { token: "abc", nova_senha: "S1!" } }), res);

      expect(res.statusCode).toBe(200);
    });

    it("retorna 400 para token invalido ou expirado", async () => {
      authServiceMocks.resetPassword.mockRejectedValue(new Error("Token invalido ou expirado."));

      const res = criarRes();
      await controller.resetPassword(criarReq(), res);

      expect(res.statusCode).toBe(400);
      expect((res.body as any).error).toBe("Token invalido ou expirado.");
    });
  });

  // ─── criarConvite ───────────────────────────────────────────────────────────

  describe("criarConvite", () => {
    it("retorna 201 com link do convite", async () => {
      authServiceMocks.criarConvite.mockResolvedValue({ link: "http://localhost/register?token=abc", expira_em: new Date(), cargo: "ALUNO" });

      const req = criarReq({ body: { email: "novo@test.local" }, usuario: { id: 1 } } as any);
      const res = criarRes();
      await controller.criarConvite(req, res);

      expect(res.statusCode).toBe(201);
      expect((res.body as any).link).toContain("/register?token=");
    });

    it("retorna 400 para erro", async () => {
      authServiceMocks.criarConvite.mockRejectedValue(new Error("Erro ao criar convite"));

      const req = criarReq({ usuario: { id: 1 } } as any);
      const res = criarRes();
      await controller.criarConvite(req, res);

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── validarConvite ─────────────────────────────────────────────────────────

  describe("validarConvite", () => {
    it("retorna 200 com dados do convite valido", async () => {
      authServiceMocks.validarConvite.mockResolvedValue({ email: "x@test.local", cargo: "ALUNO", expira_em: new Date() });

      const req = criarReq({ params: { token: "abc123" } });
      const res = criarRes();
      await controller.validarConvite(req, res);

      expect(res.statusCode).toBe(200);
      expect((res.body as any).cargo).toBe("ALUNO");
    });

    it("retorna 400 para convite invalido ou expirado", async () => {
      authServiceMocks.validarConvite.mockRejectedValue(new Error("Convite inválido ou expirado."));

      const req = criarReq({ params: { token: "invalido" } });
      const res = criarRes();
      await controller.validarConvite(req, res);

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── registrarComConvite ─────────────────────────────────────────────────────

  describe("registrarComConvite", () => {
    it("retorna 201 no sucesso", async () => {
      authServiceMocks.registrarComConvite.mockResolvedValue({ token: "tok", usuario: { id: 20 } });

      const res = criarRes();
      await controller.registrarComConvite(criarReq({ body: {} }), res);

      expect(res.statusCode).toBe(201);
    });

    it("retorna 400 para e-mail ja cadastrado (P2002)", async () => {
      authServiceMocks.registrarComConvite.mockRejectedValue({ code: "P2002", meta: { target: ["email"] } });

      const res = criarRes();
      await controller.registrarComConvite(criarReq(), res);

      expect(res.statusCode).toBe(400);
      expect((res.body as any).error).toBe("E-mail ja cadastrado.");
    });

    it("retorna 400 para outros erros", async () => {
      authServiceMocks.registrarComConvite.mockRejectedValue(new Error("Convite inválido ou expirado."));

      const res = criarRes();
      await controller.registrarComConvite(criarReq(), res);

      expect(res.statusCode).toBe(400);
    });
  });
});
