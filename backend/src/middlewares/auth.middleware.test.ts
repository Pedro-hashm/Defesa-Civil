import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

const prismaMocks = vi.hoisted(() => ({
  mockSessaoFindFirst: vi.fn(),
}));

vi.mock("../config/prisma", () => ({
  prisma: {
    sessao: {
      findFirst: prismaMocks.mockSessaoFindFirst,
    },
  },
}));

import { authMiddleware } from "./auth.middleware";

function criarResponse() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as Response & { statusCode: number; body: unknown };
}

describe("authMiddleware", () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
    vi.clearAllMocks();
  });

  it("retorna 401 sem header Authorization", async () => {
    const req = { headers: {} } as Request;
    const res = criarResponse();

    await authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Token não fornecido." });
    expect(next).not.toHaveBeenCalled();
  });

  it("retorna 401 para token invalido", async () => {
    prismaMocks.mockSessaoFindFirst.mockResolvedValue(null);
    const req = { headers: { authorization: "Bearer token-invalido" } } as Request;
    const res = criarResponse();

    await authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Token inválido." });
  });

  it("retorna 401 para token expirado", async () => {
    prismaMocks.mockSessaoFindFirst.mockResolvedValue({
      expira_em: new Date("2020-01-01"),
      usuario: { id: 1, ativo: true },
    });
    const req = { headers: { authorization: "Bearer token-exp" } } as Request;
    const res = criarResponse();

    await authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Token expirado." });
  });

  it("retorna 401 para usuario inativo", async () => {
    prismaMocks.mockSessaoFindFirst.mockResolvedValue({
      expira_em: new Date(Date.now() + 60_000),
      usuario: { id: 1, ativo: false },
    });
    const req = { headers: { authorization: "Bearer token-ok" } } as Request;
    const res = criarResponse();

    await authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Usuário inativo." });
  });

  it("anexa usuario e chama next para sessao valida", async () => {
    const usuario = {
      id: 7,
      nome: "Admin",
      email: "admin@test.local",
      cargo: "ADMIN",
      ativo: true,
      criado_em: new Date(),
    };
    prismaMocks.mockSessaoFindFirst.mockResolvedValue({
      expira_em: new Date(Date.now() + 60_000),
      usuario,
    });

    const req = { headers: { authorization: "Bearer token-valido" } } as Request;
    const res = criarResponse();

    await authMiddleware(req, res, next);

    expect(req.usuario).toEqual(usuario);
    expect(next).toHaveBeenCalledOnce();
  });
});
