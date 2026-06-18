import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { salvarSimulacaoFideDmate } from "../simuladorService";

function mockFetchSequence(responses: Array<{ data: unknown; ok?: boolean }>) {
  return vi.fn().mockImplementation(async () => {
    const next = responses.shift();
    if (!next) {
      throw new Error("fetch chamado mais vezes que o esperado");
    }
    return {
      ok: next.ok ?? true,
      json: async () => next.data,
    };
  });
}

describe("simuladorService", () => {
  beforeEach(() => {
    localStorage.setItem("defesa-civil.token", "token-sim");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("busca id do FIDE e salva tentativa com geojson normalizado", async () => {
    const geojson = { type: "FeatureCollection", features: [] };
    const fetchMock = mockFetchSequence([
      {
        data: [
          { id: 99, titulo: "FIDE Padrao", descricao: null, ativo: true, criado_em: "" },
        ],
      },
      { data: { id: 1, status: "FINALIZADO" } },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    await salvarSimulacaoFideDmate({
      fide: {
        municipio: "Recife",
        mapa_geojson: JSON.stringify(geojson),
        descricao_areas: "Zona norte",
      },
      dmate: { s1_cap_superada: true },
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8080/formularios",
      expect.any(Object)
    );

    const segundaChamada = fetchMock.mock.calls[1];
    expect(segundaChamada[0]).toBe("http://localhost:8080/tentativas");
    const body = JSON.parse(String(segundaChamada[1]?.body));
    expect(body.formulario_id).toBe(99);
    expect(body.respostas.fide.mapa_geojson).toEqual(geojson);
    expect(body.respostas.fide.areaPopulacaoAfetada.mapa_selecao).toEqual(geojson);
    expect(body.respostas.dmate).toEqual({ s1_cap_superada: true });
  });

  it("falha quando formulario FIDE nao existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence([
        {
          data: [{ id: 1, titulo: "DMATE apenas", descricao: null, ativo: true, criado_em: "" }],
        },
      ])
    );

    await expect(
      salvarSimulacaoFideDmate({ fide: {}, dmate: {} })
    ).rejects.toThrow("Formulario FIDE nao encontrado no backend.");
  });
});
