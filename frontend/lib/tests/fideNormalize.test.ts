import { describe, expect, it } from "vitest";
import { normalizeFideData } from "../fideNormalize";

describe("normalizeFideData", () => {
  it("propaga geojson string para mapa_selecao", () => {
    const geojson = {
      type: "FeatureCollection",
      features: [],
    };

    const resultado = normalizeFideData({
      mapa_geojson: JSON.stringify(geojson),
      descricao_areas: "Area norte",
    });

    expect(resultado.mapa_geojson).toEqual(geojson);
    expect(resultado.areaPopulacaoAfetada).toEqual({
      mapa_selecao: geojson,
      descricao_areas_afetadas: "Area norte",
    });
  });

  it("preserva areaPopulacaoAfetada existente", () => {
    const geojson = { type: "FeatureCollection", features: [] };

    const resultado = normalizeFideData({
      mapa_geojson: geojson,
      areaPopulacaoAfetada: {
        matriz_ocupacao: { residencial: "Alta" },
        descricao_areas_afetadas: "Centro",
      },
    });

    expect(resultado.areaPopulacaoAfetada).toEqual({
      matriz_ocupacao: { residencial: "Alta" },
      descricao_areas_afetadas: "Centro",
      mapa_selecao: geojson,
    });
  });

  it("retorna copia inalterada sem mapa", () => {
    const entrada = { municipio: "Recife" };
    expect(normalizeFideData(entrada)).toEqual(entrada);
  });
});
