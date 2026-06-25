import { describe, expect, it } from "vitest";
import { hashSenhaFront, validarForcaSenhaFront } from "../passwordUtils";

describe("passwordUtils", () => {
  describe("validarForcaSenhaFront", () => {
    it("aceita senha forte", () => {
      const resultado = validarForcaSenhaFront("Abcdef12!");
      expect(resultado.valida).toBe(true);
      expect(resultado.erros).toHaveLength(0);
    });

    it("lista erros de senha fraca", () => {
      const resultado = validarForcaSenhaFront("abc");
      expect(resultado.valida).toBe(false);
      expect(resultado.erros.length).toBeGreaterThan(0);
      expect(resultado.regras.minimo8).toBe(false);
    });
  });

  describe("hashSenhaFront", () => {
    it("gera hash sha-256 deterministico com prefixo e sufixo", async () => {
      const hash1 = await hashSenhaFront("MinhaSenha1!");
      const hash2 = await hashSenhaFront("MinhaSenha1!");

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe("MinhaSenha1!");
    });

    it("gera hashes diferentes para senhas diferentes", async () => {
      const hashA = await hashSenhaFront("SenhaA1!");
      const hashB = await hashSenhaFront("SenhaB1!");
      expect(hashA).not.toBe(hashB);
    });
  });
});
