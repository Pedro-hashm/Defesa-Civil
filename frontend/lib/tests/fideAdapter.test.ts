import { describe, expect, it } from "vitest";
import { adaptarFideParaPlano } from "../fideAdapter";

describe("adaptarFideParaPlano", () => {
  it("retorna vazio quando nao ha identificacao", () => {
    expect(adaptarFideParaPlano({})).toEqual({});
    expect(adaptarFideParaPlano({ municipio: "X" })).toEqual({ municipio: "X" });
  });

  it("achata estrutura aninhada do FIDE", () => {
    const nested = {
      identificacao: {
        uf: "PE",
        municipio: "Araripina",
        codigoIbge: "2601102",
        populacao: 90000,
      },
      tipificacao: { cobrade: "1.1.1.1.0" },
      dataOcorrencia: { dia: 10, mes: 3, ano: 2026, horario: "14:00" },
      areaPopulacaoAfetada: {
        descricao_areas_afetadas: "Zona rural",
        matriz_ocupacao: { residencial: "Alta", comercial: "Baixa" },
      },
      danosHumanos: {
        mortos: 0,
        feridos: 2,
        outrosAfetados: 5,
      },
      danosMateriais: {
        linhas: [
          {
            discriminacao: "Unidades habitacionais",
            quantidadeDanificadas: 3,
            quantidadeDestruidas: 1,
            valorReais: 1000,
          },
        ],
      },
      danosAmbientais: {
        poluicaoAgua: true,
        poluicaoAr: false,
        descricaoPopulacaoAtingida: "500 pessoas",
      },
      prejuizosEconomicosPublicos: {
        porServico: { saude: 100, agua: 50 },
        descricao: "Danos em rede",
      },
      prejuizosEconomicosPrivados: {
        agricultura: 200,
        comercio: 300,
        descricao: "Perdas privadas",
      },
      causasEfeitos: "Chuvas intensas",
    };

    const flat = adaptarFideParaPlano(nested);

    expect(flat.uf).toBe("PE");
    expect(flat.municipio).toBe("Araripina");
    expect(flat.codigo_ibge).toBe("2601102");
    expect(flat.cobrade).toBe("1.1.1.1.0");
    expect(flat.ocupacao_residencial).toBe("Alta");
    expect(flat.humanos_feridos).toBe(2);
    expect(flat.mat_habitacionais_dan).toBe(3);
    expect(flat.mat_habitacionais_des).toBe(1);
    expect(flat.mat_habitacionais_val).toBe(1000);
    expect(flat.amb_agua_sn).toBe("sim");
    expect(flat.amb_ar_sn).toBe("nao");
    expect(flat.prej_pub_saude).toBe(100);
    expect(flat.prej_priv_comercio).toBe(300);
    expect(flat.causas_efeitos).toBe("Chuvas intensas");
  });
});
