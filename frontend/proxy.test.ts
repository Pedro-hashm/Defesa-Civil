import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import middleware from "./proxy";

vi.mock("next/server", () => {
  class MockNextResponse {
    status: number;
    headers: Headers;

    constructor(status: number, headers: Headers) {
      this.status = status;
      this.headers = headers;
    }

    static next() {
      return new MockNextResponse(200, new Headers());
    }

    static redirect(url: URL) {
      const headers = new Headers({ location: url.toString() });
      return new MockNextResponse(307, headers);
    }
  }

  return { NextResponse: MockNextResponse };
});

function criarRequest(pathname: string, cookies: Record<string, string> = {}) {
  const url = `http://localhost:3000${pathname}`;
  return {
    nextUrl: new URL(url),
    url,
    cookies: {
      get: (name: string) => {
        const value = cookies[name];
        return value ? { value } : undefined;
      },
    },
  } as unknown as NextRequest;
}

describe("proxy middleware", () => {
  it("libera rotas publicas", () => {
    const resposta = middleware(criarRequest("/"));
    expect(resposta.status).toBe(200);
  });

  it("redireciona para login sem credenciais", () => {
    const resposta = middleware(criarRequest("/simulador"));
    expect(resposta.status).toBe(307);
    expect(resposta.headers.get("location")).toContain("/");
  });

  it("bloqueia ALUNO fora das rotas permitidas", () => {
    const resposta = middleware(
      criarRequest("/usuarios", {
        "defesa-civil.token": "t",
        "defesa-civil.cargo": "ALUNO",
      })
    );
    expect(resposta.status).toBe(307);
    expect(resposta.headers.get("location")).toContain("/comunicados");
  });

  it("permite ALUNO no simulador", () => {
    const resposta = middleware(
      criarRequest("/simulador/fide-dmate", {
        "defesa-civil.token": "t",
        "defesa-civil.cargo": "ALUNO",
      })
    );
    expect(resposta.status).toBe(200);
  });

  it("bloqueia ADMIN em minhas-respostas", () => {
    const resposta = middleware(
      criarRequest("/minhas-respostas", {
        "defesa-civil.token": "t",
        "defesa-civil.cargo": "ADMIN",
      })
    );
    expect(resposta.status).toBe(307);
    expect(resposta.headers.get("location")).toContain("/comunicados");
  });

  it("permite ADMIN em respostas", () => {
    const resposta = middleware(
      criarRequest("/respostas", {
        "defesa-civil.token": "t",
        "defesa-civil.cargo": "ADMIN",
      })
    );
    expect(resposta.status).toBe(200);
  });
});
