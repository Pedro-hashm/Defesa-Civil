import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  criarConvite,
  forgotPassword,
  gerarLinkResetAdmin,
  login,
  registrarComConvite,
  resetPassword,
  validarConvite,
} from "../authService";

function mockFetchJson(data: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => data,
  });
}

describe("authService", () => {
  beforeEach(() => {
    localStorage.setItem("defesa-civil.token", "admin-token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("login normaliza email e envia recaptcha", async () => {
    const fetchMock = mockFetchJson({
      token: "jwt",
      expira_em: "2026-12-31",
      usuario: { id: 1, nome: "Admin", email: "a@b.com", cargo: "ADMIN", ativo: true, criado_em: "" },
    });
    vi.stubGlobal("fetch", fetchMock);

    const resposta = await login("  Admin@Mail.COM ", "hash", "recaptcha-1");

    expect(resposta.token).toBe("jwt");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "admin@mail.com",
          senha: "hash",
          recaptcha_token: "recaptcha-1",
        }),
      })
    );
  });

  it("forgotPassword envia email normalizado", async () => {
    const fetchMock = mockFetchJson({ message: "ok" });
    vi.stubGlobal("fetch", fetchMock);

    await forgotPassword(" User@Test.COM ");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/auth/forgot-password",
      expect.objectContaining({
        body: JSON.stringify({ email: "user@test.com" }),
      })
    );
  });

  it("resetPassword envia token e nova senha", async () => {
    const fetchMock = mockFetchJson({ message: "senha alterada" });
    vi.stubGlobal("fetch", fetchMock);

    await resetPassword("token-reset", "NovaSenha1!");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/auth/reset-password",
      expect.objectContaining({
        body: JSON.stringify({ token: "token-reset", nova_senha: "NovaSenha1!" }),
      })
    );
  });

  it("criarConvite envia Authorization", async () => {
    const fetchMock = mockFetchJson({
      link: "http://x/register?token=abc",
      expira_em: "2026-12-31",
      cargo: "ALUNO",
    });
    vi.stubGlobal("fetch", fetchMock);

    await criarConvite("aluno@test.com", "ALUNO");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/auth/convite",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer admin-token",
        }),
      })
    );
  });

  it("validarConvite consulta endpoint publico", async () => {
    const fetchMock = mockFetchJson({
      email: "aluno@test.com",
      cargo: "ALUNO",
      expira_em: "2026-12-31",
    });
    vi.stubGlobal("fetch", fetchMock);

    const info = await validarConvite("convite-token");
    expect(info.cargo).toBe("ALUNO");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/auth/convite/convite-token"
    );
  });

  it("registrarComConvite envia dados de cadastro", async () => {
    const fetchMock = mockFetchJson({
      token: "jwt",
      expira_em: "2026-12-31",
      usuario: { id: 2, nome: "Aluno", email: "a@b.com", cargo: "ALUNO", ativo: true, criado_em: "" },
    });
    vi.stubGlobal("fetch", fetchMock);

    await registrarComConvite("convite", "Aluno", "aluno@test.com", "hash");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/auth/registrar",
      expect.objectContaining({
        body: JSON.stringify({
          token: "convite",
          nome: "Aluno",
          email: "aluno@test.com",
          senha: "hash",
        }),
      })
    );
  });

  it("gerarLinkResetAdmin chama endpoint autenticado", async () => {
    const fetchMock = mockFetchJson({
      link: "http://x/reset?token=abc",
      expira_em: "2026-12-31",
    });
    vi.stubGlobal("fetch", fetchMock);

    await gerarLinkResetAdmin(7);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/usuarios/7/gerar-link-reset",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer admin-token" },
      })
    );
  });

  it("propaga erro da API", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchJson({ message: "Credenciais invalidas" }, false)
    );

    await expect(login("a@b.com", "x", "r")).rejects.toThrow(
      "Credenciais invalidas"
    );
  });
});
