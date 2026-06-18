import { beforeEach, describe, expect, it, vi } from "vitest";
import { aplicarPepper, validarForcaSenha } from "./password";

describe("password", () => {
  beforeEach(() => {
    vi.stubEnv("PASSWORD_PREFIXO", "srv@");
    vi.stubEnv("PASSWORD_SUFIXO", "@srv");
  });

  describe("aplicarPepper", () => {
    it("envolve hash do frontend com prefixo e sufixo do servidor", () => {
      expect(aplicarPepper("abc123hash")).toBe("srv@abc123hash@srv");
    });
  });

  describe("validarForcaSenha", () => {
    it("aceita senha que atende todas as regras", () => {
      const resultado = validarForcaSenha("Abcdef12!");
      expect(resultado.valida).toBe(true);
      expect(resultado.erros).toHaveLength(0);
    });

    it("rejeita senha curta", () => {
      const resultado = validarForcaSenha("Ab1!");
      expect(resultado.valida).toBe(false);
      expect(resultado.erros.some((e) => e.includes("8 caracteres"))).toBe(true);
    });

    it("rejeita senha sem maiuscula", () => {
      const resultado = validarForcaSenha("abcdef12!");
      expect(resultado.valida).toBe(false);
      expect(resultado.erros.some((e) => e.includes("maiúscula"))).toBe(true);
    });

    it("rejeita senha sem caractere especial", () => {
      const resultado = validarForcaSenha("Abcdef12");
      expect(resultado.valida).toBe(false);
      expect(resultado.erros.some((e) => e.includes("especial"))).toBe(true);
    });
  });
});
