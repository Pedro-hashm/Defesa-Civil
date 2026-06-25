import { describe, expect, it } from "vitest";
import {
  detectarTipoFormulario,
  extrairRaizRecursos,
  resumoRecursos,
  rotaEdicaoTentativa,
  rotuloTipoFormulario,
} from "./formularios";

describe("formularios", () => {
  it("detecta solicitacao de recursos pelas respostas", () => {
    expect(
      detectarTipoFormulario("DMATE — Padrão", {
        solicitacao_recursos: { uf: "PE" },
      })
    ).toBe("RECURSOS");
  });

  it("detecta fide e dmate combinados", () => {
    expect(
      detectarTipoFormulario("FIDE — Padrão", {
        fide: { municipio: "Recife" },
        dmate: { s1_cap_superada: true },
      })
    ).toBe("FIDE_DMATE");
  });

  it("gera rota de edicao correta", () => {
    expect(rotaEdicaoTentativa(10, "RECURSOS")).toBe(
      "/simulador/solicitar-recursos?edit=10"
    );
    expect(rotaEdicaoTentativa(10, "FIDE")).toBe(
      "/simulador/fide-dmate?edit=10"
    );
  });

  it("extrai dados e calcula resumo de recursos", () => {
    const resumo = resumoRecursos({
      solicitacao_recursos: {
        uf: "PE",
        cobrade: "1.2.1.0.0",
        itens_meta: [
          { quantidade: 2, valor_unitario: 100 },
          { quantidade: 1, valor_unitario: 50 },
        ],
      },
    });

    expect(resumo.raiz.uf).toBe("PE");
    expect(resumo.qtdItens).toBe(2);
    expect(resumo.valorTotal).toBe(250);
  });

  it("extrai raiz quando dados vierem soltos", () => {
    const raiz = extrairRaizRecursos({ uf: "PE", tipo_solicitacao: "OCP" });
    expect(raiz.uf).toBe("PE");
  });

  it("rotula tipos de formulario", () => {
    expect(rotuloTipoFormulario("RECURSOS")).toBe("Solicitação de Recursos");
    expect(rotuloTipoFormulario("FIDE_DMATE")).toBe("FIDE + DMATE");
  });
});
