import { describe, expect, it } from "vitest";
import { deepParseJSON, parseRespostas } from "../json";

describe("json", () => {
  describe("deepParseJSON", () => {
    it("descompacta string json aninhada", () => {
      const entrada = JSON.stringify({ a: JSON.stringify({ b: 1 }) });
      expect(deepParseJSON(entrada)).toEqual({ a: { b: 1 } });
    });

    it("percorre arrays e objetos", () => {
      const entrada = {
        lista: [JSON.stringify({ x: 1 })],
        texto: "puro",
      };
      expect(deepParseJSON(entrada)).toEqual({
        lista: [{ x: 1 }],
        texto: "puro",
      });
    });

    it("retorna string pura se nao for json", () => {
      expect(deepParseJSON("texto")).toBe("texto");
    });
  });

  describe("parseRespostas", () => {
    it("descompacta respostas em string", () => {
      const payload = { fide: { municipio: "Recife" } };
      expect(parseRespostas(JSON.stringify(payload))).toEqual(payload);
    });

    it("retorna objeto vazio para string invalida", () => {
      expect(parseRespostas("{invalido")).toEqual({});
    });

    it("retorna objeto quando ja parseado", () => {
      const payload = { dmate: { ok: true } };
      expect(parseRespostas(payload)).toEqual(payload);
    });
  });
});
