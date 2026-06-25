import { beforeEach, describe, expect, it, vi } from "vitest";
import { Cargo } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { rolesMiddleware } from "./roles.middleware";

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

describe("rolesMiddleware", () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  it("retorna 401 sem usuario autenticado", () => {
    const req = {} as Request;
    const res = criarResponse();

    rolesMiddleware("ADMIN")(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Não autenticado." });
    expect(next).not.toHaveBeenCalled();
  });

  it("retorna 403 para cargo insuficiente", () => {
    const req = {
      usuario: { cargo: "ALUNO" as Cargo },
    } as Request;
    const res = criarResponse();

    rolesMiddleware("ADMIN")(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: "Acesso negado. Cargo insuficiente." });
    expect(next).not.toHaveBeenCalled();
  });

  it("libera acesso para cargo permitido", () => {
    const req = {
      usuario: { cargo: "ADMIN" as Cargo },
    } as Request;
    const res = criarResponse();

    rolesMiddleware("ADMIN", "ALUNO")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });
});
