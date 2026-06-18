import { beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "crypto";

const prismaMocks = vi.hoisted(() => ({
  mockUsuarioFindUnique: vi.fn(),
  mockUsuarioCreate: vi.fn(),
  mockUsuarioUpdate: vi.fn(),
  mockSessaoCreate: vi.fn(),
  mockSessaoDeleteMany: vi.fn(),
  mockRecuperacaoCreate: vi.fn(),
  mockRecuperacaoFindUnique: vi.fn(),
  mockRecuperacaoUpdate: vi.fn(),
  mockConviteCreate: vi.fn(),
  mockConviteFindUnique: vi.fn(),
  mockConviteUpdate: vi.fn(),
  mockTransaction: vi.fn(),
}));

const bcryptMocks = vi.hoisted(() => ({
  mockHash: vi.fn(),
  mockCompare: vi.fn(),
}));

vi.mock("../../config/prisma", () => ({
  prisma: {
    usuario: {
      findUnique: prismaMocks.mockUsuarioFindUnique,
      create: prismaMocks.mockUsuarioCreate,
      update: prismaMocks.mockUsuarioUpdate,
    },
    sessao: {
      create: prismaMocks.mockSessaoCreate,
      deleteMany: prismaMocks.mockSessaoDeleteMany,
    },
    recuperacaoSenha: {
      create: prismaMocks.mockRecuperacaoCreate,
      findUnique: prismaMocks.mockRecuperacaoFindUnique,
      update: prismaMocks.mockRecuperacaoUpdate,
    },
    conviteRegistro: {
      create: prismaMocks.mockConviteCreate,
      findUnique: prismaMocks.mockConviteFindUnique,
      update: prismaMocks.mockConviteUpdate,
    },
    $transaction: prismaMocks.mockTransaction,
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: bcryptMocks.mockHash,
    compare: bcryptMocks.mockCompare,
  },
}));

import { AuthService } from "./auth.service";

const usuarioLogin = {
  id: 10,
  nome: "Aluno",
  email: "aluno@test.local",
  senha_hash: "hash-armazenado",
  cargo: "ALUNO" as const,
  ativo: true,
  criado_em: new Date("2026-01-01"),
  tentativas_login: 0,
  bloqueado_ate: null as Date | null,
};

function tokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

describe("AuthService", () => {
  const service = new AuthService();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "");
    bcryptMocks.mockHash.mockResolvedValue("nova-senha-hash");
    bcryptMocks.mockCompare.mockResolvedValue(true);
    prismaMocks.mockSessaoCreate.mockResolvedValue({
      token: "sessao-token",
      expira_em: new Date(Date.now() + 86_400_000),
    });
    prismaMocks.mockSessaoDeleteMany.mockResolvedValue({ count: 0 });
    prismaMocks.mockUsuarioUpdate.mockResolvedValue(usuarioLogin);
  });

  describe("cadastro", () => {
    it("cria usuario, sessao e retorna token", async () => {
      prismaMocks.mockUsuarioCreate.mockResolvedValue({
        id: 1,
        nome: "Novo",
        email: "novo@test.local",
        cargo: "ALUNO",
        ativo: true,
        criado_em: new Date(),
      });

      const resultado = await service.cadastro({
        nome: "Novo",
        email: "Novo@Test.Local",
        senha: "SenhaForte1!",
        cargo: "ALUNO",
      });

      expect(prismaMocks.mockUsuarioCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "novo@test.local",
            senha_hash: "nova-senha-hash",
          }),
        })
      );
      expect(resultado.token).toMatch(/^[a-f0-9]{96}$/);
      expect(prismaMocks.mockSessaoCreate).toHaveBeenCalled();
      expect(resultado.usuario.email).toBe("novo@test.local");
    });

    it("rejeita campos obrigatorios ausentes", async () => {
      await expect(
        service.cadastro({ nome: "", email: "", senha: "" })
      ).rejects.toThrow("Campos obrigatorios");
    });

    it("rejeita senha fraca", async () => {
      await expect(
        service.cadastro({
          nome: "Novo",
          email: "novo@test.local",
          senha: "fraca",
        })
      ).rejects.toThrow("8 caracteres");
    });
  });

  describe("login", () => {
    it("autentica credenciais validas", async () => {
      prismaMocks.mockUsuarioFindUnique.mockResolvedValue(usuarioLogin);

      const resultado = await service.login({
        email: " Aluno@Test.Local ",
        senha: "hash-do-front",
        recaptcha_token: "skip",
      });

      expect(resultado.usuario.email).toBe("aluno@test.local");
      expect(prismaMocks.mockUsuarioUpdate).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { tentativas_login: 0, bloqueado_ate: null },
      });
      expect(prismaMocks.mockSessaoDeleteMany).toHaveBeenCalled();
      expect(prismaMocks.mockSessaoCreate).toHaveBeenCalled();
    });

    it("rejeita usuario inexistente", async () => {
      prismaMocks.mockUsuarioFindUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: "nao@test.local",
          senha: "x",
          recaptcha_token: "skip",
        })
      ).rejects.toThrow("Credenciais invalidas.");
    });

    it("rejeita usuario inativo", async () => {
      prismaMocks.mockUsuarioFindUnique.mockResolvedValue({
        ...usuarioLogin,
        ativo: false,
      });

      await expect(
        service.login({
          email: "aluno@test.local",
          senha: "x",
          recaptcha_token: "skip",
        })
      ).rejects.toThrow("Usuario inativo.");
    });

    it("rejeita conta bloqueada", async () => {
      prismaMocks.mockUsuarioFindUnique.mockResolvedValue({
        ...usuarioLogin,
        bloqueado_ate: new Date(Date.now() + 600_000),
      });

      await expect(
        service.login({
          email: "aluno@test.local",
          senha: "x",
          recaptcha_token: "skip",
        })
      ).rejects.toThrow("Conta temporariamente bloqueada");
    });

    it("incrementa tentativas e avisa antes do bloqueio", async () => {
      prismaMocks.mockUsuarioFindUnique.mockResolvedValue({
        ...usuarioLogin,
        tentativas_login: 3,
      });
      bcryptMocks.mockCompare.mockResolvedValue(false);

      await expect(
        service.login({
          email: "aluno@test.local",
          senha: "errada",
          recaptcha_token: "skip",
        })
      ).rejects.toThrow("1 tentativa(s) restante(s)");

      expect(prismaMocks.mockUsuarioUpdate).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          tentativas_login: 4,
          bloqueado_ate: undefined,
        },
      });
    });

    it("bloqueia apos exceder tentativas", async () => {
      prismaMocks.mockUsuarioFindUnique.mockResolvedValue({
        ...usuarioLogin,
        tentativas_login: 4,
      });
      bcryptMocks.mockCompare.mockResolvedValue(false);

      await expect(
        service.login({
          email: "aluno@test.local",
          senha: "errada",
          recaptcha_token: "skip",
        })
      ).rejects.toThrow("Conta bloqueada");
    });
  });

  describe("forgotPassword", () => {
    it("retorna mensagem generica sem revelar existencia do email", async () => {
      prismaMocks.mockUsuarioFindUnique.mockResolvedValue(null);

      const resultado = await service.forgotPassword({ email: "nao@test.local" });

      expect(resultado.message).toContain("Se o e-mail estiver cadastrado");
      expect(prismaMocks.mockRecuperacaoCreate).not.toHaveBeenCalled();
    });

    it("cria token de recuperacao para usuario ativo", async () => {
      prismaMocks.mockUsuarioFindUnique.mockResolvedValue({ id: 10, ativo: true });
      prismaMocks.mockRecuperacaoCreate.mockResolvedValue({ id: 1 });

      const resultado = await service.forgotPassword({ email: "aluno@test.local" });

      expect(resultado.message).toContain("Se o e-mail estiver cadastrado");
      expect(prismaMocks.mockRecuperacaoCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          usuario_id: 10,
          token_hash: expect.any(String),
        }),
      });
    });
  });

  describe("resetPassword", () => {
    it("redefine senha com token valido", async () => {
      const token = "token-reset";
      prismaMocks.mockRecuperacaoFindUnique.mockResolvedValue({
        id: 1,
        usuario_id: 10,
        expira_em: new Date(Date.now() + 60_000),
        usado_em: null,
      });
      prismaMocks.mockTransaction.mockResolvedValue([]);

      const resultado = await service.resetPassword({
        token,
        nova_senha: "NovaSenha1!",
      });

      expect(prismaMocks.mockRecuperacaoFindUnique).toHaveBeenCalledWith({
        where: { token_hash: tokenHash(token) },
        select: expect.any(Object),
      });
      expect(prismaMocks.mockTransaction).toHaveBeenCalled();
      expect(resultado.message).toBe("Senha redefinida com sucesso.");
    });

    it("rejeita token expirado", async () => {
      prismaMocks.mockRecuperacaoFindUnique.mockResolvedValue({
        id: 1,
        usuario_id: 10,
        expira_em: new Date("2020-01-01"),
        usado_em: null,
      });

      await expect(
        service.resetPassword({ token: "x", nova_senha: "NovaSenha1!" })
      ).rejects.toThrow("Token invalido ou expirado.");
    });
  });

  describe("gerarLinkResetAdmin", () => {
    it("gera link para usuario existente", async () => {
      prismaMocks.mockUsuarioFindUnique.mockResolvedValue({ id: 10, ativo: true });
      prismaMocks.mockRecuperacaoCreate.mockResolvedValue({ id: 1 });

      const resultado = await service.gerarLinkResetAdmin(10);

      expect(resultado.link).toContain("/reset-password?token=");
      expect(resultado.expira_em).toBeInstanceOf(Date);
    });

    it("falha se usuario nao existe", async () => {
      prismaMocks.mockUsuarioFindUnique.mockResolvedValue(null);

      await expect(service.gerarLinkResetAdmin(999)).rejects.toThrow(
        "Usuário não encontrado."
      );
    });
  });

  describe("criarConvite", () => {
    it("cria convite e retorna link de registro", async () => {
      prismaMocks.mockConviteCreate.mockResolvedValue({ id: 1 });

      const resultado = await service.criarConvite(1, {
        email: " Novo@Test.Local ",
        cargo: "ALUNO",
      });

      expect(prismaMocks.mockConviteCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          criado_por_id: 1,
          email: "novo@test.local",
          cargo: "ALUNO",
        }),
      });
      expect(resultado.link).toContain("/register?token=");
      expect(resultado.cargo).toBe("ALUNO");
    });
  });

  describe("validarConvite", () => {
    it("retorna dados de convite valido", async () => {
      const token = "convite-abc";
      prismaMocks.mockConviteFindUnique.mockResolvedValue({
        email: "aluno@test.local",
        cargo: "ALUNO",
        expira_em: new Date(Date.now() + 60_000),
        usado_em: null,
      });

      const resultado = await service.validarConvite(token);

      expect(resultado.email).toBe("aluno@test.local");
      expect(resultado.cargo).toBe("ALUNO");
    });

    it("rejeita convite expirado", async () => {
      prismaMocks.mockConviteFindUnique.mockResolvedValue({
        email: null,
        cargo: "ALUNO",
        expira_em: new Date("2020-01-01"),
        usado_em: null,
      });

      await expect(service.validarConvite("x")).rejects.toThrow(
        "Convite inválido ou expirado."
      );
    });
  });

  describe("registrarComConvite", () => {
    it("registra usuario e consome convite", async () => {
      const token = "convite-registro";
      prismaMocks.mockConviteFindUnique.mockResolvedValue({
        id: 5,
        email: "aluno@test.local",
        cargo: "ALUNO",
        expira_em: new Date(Date.now() + 60_000),
        usado_em: null,
      });

      const usuarioCriado = {
        id: 20,
        nome: "Aluno Novo",
        email: "aluno@test.local",
        cargo: "ALUNO" as const,
        ativo: true,
        criado_em: new Date(),
      };

      prismaMocks.mockTransaction.mockImplementation(async (callback) =>
        callback({
          usuario: { create: vi.fn().mockResolvedValue(usuarioCriado) },
          conviteRegistro: { update: prismaMocks.mockConviteUpdate },
        })
      );

      const resultado = await service.registrarComConvite({
        token,
        nome: "Aluno Novo",
        email: "aluno@test.local",
        senha: "SenhaForte1!",
      });

      expect(resultado.usuario.id).toBe(20);
      expect(resultado.token).toMatch(/^[a-f0-9]{96}$/);
      expect(prismaMocks.mockSessaoCreate).toHaveBeenCalled();
    });

    it("rejeita email diferente do convite", async () => {
      prismaMocks.mockConviteFindUnique.mockResolvedValue({
        id: 5,
        email: "outro@test.local",
        cargo: "ALUNO",
        expira_em: new Date(Date.now() + 60_000),
        usado_em: null,
      });

      await expect(
        service.registrarComConvite({
          token: "x",
          nome: "Aluno",
          email: "aluno@test.local",
          senha: "SenhaForte1!",
        })
      ).rejects.toThrow("O e-mail não corresponde ao convite.");
    });
  });
});
