import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const prismaMocks = vi.hoisted(() => ({
  mockUsuarioCreate: vi.fn(),
  mockUsuarioFindMany: vi.fn(),
  mockUsuarioFindUnique: vi.fn(),
  mockUsuarioUpdate: vi.fn(),
  mockUsuarioDelete: vi.fn(),
  mockSessaoDeleteMany: vi.fn(),
  mockTransaction: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  mockGerarLinkResetAdmin: vi.fn(),
}));

vi.mock("../../config/prisma", () => ({
  prisma: {
    usuario: {
      create: prismaMocks.mockUsuarioCreate,
      findMany: prismaMocks.mockUsuarioFindMany,
      findUnique: prismaMocks.mockUsuarioFindUnique,
      update: prismaMocks.mockUsuarioUpdate,
      delete: prismaMocks.mockUsuarioDelete,
    },
    sessao: {
      deleteMany: prismaMocks.mockSessaoDeleteMany,
    },
    $transaction: prismaMocks.mockTransaction,
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("senha-hash-bcrypt"),
    compare: vi.fn(),
  },
}));

vi.mock("../Auth/auth.service", () => ({
  AuthService: vi.fn().mockImplementation(() => ({
    gerarLinkResetAdmin: authMocks.mockGerarLinkResetAdmin,
  })),
}));

import { UsuarioService } from "./usuario.service";

const usuarioBase = {
  id: 1,
  nome: "Aluno Teste",
  email: "aluno@test.local",
  cargo: "ALUNO" as const,
  ativo: true,
  criado_em: new Date("2026-01-01"),
  ordem_id: null,
  ordem: null,
};

describe("UsuarioService", () => {
  const service = new UsuarioService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("cria usuario com senha hasheada", async () => {
      prismaMocks.mockUsuarioCreate.mockResolvedValue(usuarioBase);

      const resultado = await service.create({
        nome: "Aluno Teste",
        email: "aluno@test.local",
        senha: "SenhaForte1!",
        cargo: "ALUNO",
      });

      expect(prismaMocks.mockUsuarioCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nome: "Aluno Teste",
          email: "aluno@test.local",
          senha_hash: "senha-hash-bcrypt",
          cargo: "ALUNO",
          ativo: true,
        }),
        select: expect.any(Object),
      });
      expect(resultado).toEqual(usuarioBase);
    });

    it("exige cargo", async () => {
      await expect(
        service.create({
          nome: "X",
          email: "x@test.local",
          senha: "SenhaForte1!",
          cargo: undefined as unknown as "ALUNO",
        })
      ).rejects.toThrow("O campo 'cargo' é obrigatório");
    });

    it("rejeita senha fraca", async () => {
      await expect(
        service.create({
          nome: "X",
          email: "x@test.local",
          senha: "fraca",
          cargo: "ALUNO",
        })
      ).rejects.toThrow("8 caracteres");
    });
  });

  describe("update", () => {
    it("rejeita cargo invalido", async () => {
      await expect(
        service.update(1, { cargo: "SUPER" as "ADMIN" })
      ).rejects.toThrow("Cargo inválido");
    });

    it("atualiza campos informados", async () => {
      prismaMocks.mockUsuarioUpdate.mockResolvedValue({
        ...usuarioBase,
        nome: "Novo Nome",
      });

      await service.update(1, { nome: "Novo Nome", ativo: false });

      expect(prismaMocks.mockUsuarioUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nome: "Novo Nome", ativo: false },
        select: expect.any(Object),
      });
    });
  });

  describe("setActive", () => {
    it("remove sessoes ao desativar usuario", async () => {
      prismaMocks.mockTransaction.mockImplementation(async (callback) =>
        callback({
          usuario: { update: prismaMocks.mockUsuarioUpdate },
          sessao: { deleteMany: prismaMocks.mockSessaoDeleteMany },
        })
      );
      prismaMocks.mockUsuarioUpdate.mockResolvedValue({ ...usuarioBase, ativo: false });

      await service.setActive(1, false);

      expect(prismaMocks.mockSessaoDeleteMany).toHaveBeenCalledWith({
        where: { usuario_id: 1 },
      });
    });

    it("propaga P2025", async () => {
      const erro = new Prisma.PrismaClientKnownRequestError("not found", {
        code: "P2025",
        clientVersion: "4.16",
      });
      prismaMocks.mockTransaction.mockRejectedValue(erro);

      await expect(service.setActive(999, false)).rejects.toBe(erro);
    });
  });

  describe("delete", () => {
    it("remove usuario por id", async () => {
      prismaMocks.mockUsuarioDelete.mockResolvedValue({
        id: 1,
        nome: "Aluno",
        email: "aluno@test.local",
      });

      const resultado = await service.delete(1);
      expect(resultado.email).toBe("aluno@test.local");
    });
  });

  describe("gerarLinkReset", () => {
    it("delega para AuthService", async () => {
      const payload = {
        link: "http://localhost:3000/reset-password?token=abc",
        expira_em: new Date(),
      };
      authMocks.mockGerarLinkResetAdmin.mockResolvedValue(payload);

      const resultado = await service.gerarLinkReset(1);
      expect(authMocks.mockGerarLinkResetAdmin).toHaveBeenCalledWith(1);
      expect(resultado).toEqual(payload);
    });
  });

  describe("desbloquear", () => {
    it("zera tentativas e bloqueio", async () => {
      prismaMocks.mockUsuarioUpdate.mockResolvedValue(usuarioBase);

      await service.desbloquear(1);

      expect(prismaMocks.mockUsuarioUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { tentativas_login: 0, bloqueado_ate: null },
        select: expect.any(Object),
      });
    });
  });
});
