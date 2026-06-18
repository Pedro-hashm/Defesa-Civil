import { describe, expect, it } from "vitest";
import {
  exibirNumeroOuTexto,
  exibirSimNao,
  exibirTexto,
  getBadgeClassStatus,
} from "../display";

describe("display", () => {
  describe("getBadgeClassStatus", () => {
    it("retorna classe para cada status conhecido", () => {
      expect(getBadgeClassStatus("FINALIZADO")).toContain("emerald");
      expect(getBadgeClassStatus("INICIADO")).toContain("amber");
      expect(getBadgeClassStatus("ERRO")).toContain("red");
    });

    it("retorna classe padrao para status desconhecido", () => {
      expect(getBadgeClassStatus("OUTRO")).toContain("slate");
    });
  });

  describe("exibirTexto", () => {
    it("retorna hifen para valores vazios", () => {
      expect(exibirTexto(null)).toBe("-");
      expect(exibirTexto(undefined)).toBe("-");
      expect(exibirTexto("")).toBe("-");
    });

    it("converte valor para string", () => {
      expect(exibirTexto("Recife")).toBe("Recife");
      expect(exibirTexto(42)).toBe("42");
    });
  });

  describe("exibirSimNao", () => {
    it("interpreta booleanos e strings sim/nao", () => {
      expect(exibirSimNao(true)).toBe("Sim");
      expect(exibirSimNao("sim")).toBe("Sim");
      expect(exibirSimNao(false)).toBe("Não");
      expect(exibirSimNao("nao")).toBe("Não");
      expect(exibirSimNao(null)).toBe("-");
    });
  });

  describe("exibirNumeroOuTexto", () => {
    it("formata numeros em pt-BR", () => {
      expect(exibirNumeroOuTexto(1500)).toMatch(/1\.?500/);
    });

    it("retorna hifen para vazio", () => {
      expect(exibirNumeroOuTexto("")).toBe("-");
    });
  });
});
