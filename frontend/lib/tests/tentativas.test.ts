import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  carregarCatalogoSimulado,
  formatarDataBR,
  listarTentativasSupervisor,
  montarRespostaDmate,
  montarRespostaFide,
  salvarTentativaFormulario,
} from "../tentativas";

function mockFetchJson(data: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => data,
  });
}

describe("tentativas", () => {
  beforeEach(() => {
    localStorage.setItem("defesa-civil.token", "token-teste");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("formatarDataBR", () => {
    it("retorna hifen para valor vazio", () => {
      expect(formatarDataBR(null)).toBe("-");
      expect(formatarDataBR(undefined)).toBe("-");
    });

    it("formata data ISO em pt-BR", () => {
      const formatado = formatarDataBR("2026-03-10T14:30:00.000Z");
      expect(formatado).toMatch(/10\/03\/2026/);
    });
  });

  describe("montarRespostaFide", () => {
    it("monta estrutura aninhada a partir de campos flat", () => {
      const resultado = montarRespostaFide({
        uf: "PE",
        municipio: "Recife",
        codigo_ibge: "2611606",
        populacao: "900000",
        humanos_mortos: "0",
        humanos_feridos: "2",
        amb_agua_sn: "sim",
        amb_ar_sn: "nao",
        mat_habitacionais_dan: "3",
        mat_habitacionais_des: "1",
        mat_habitacionais_val: "1000",
        prej_pub_saude: "100",
        prej_pub_agua: "50",
        prej_priv_comercio: "200",
      });

      expect(resultado.identificacao).toEqual({
        uf: "PE",
        municipio: "Recife",
        codigoIbge: "2611606",
        populacao: 900000,
        pibAnual: undefined,
        orcamentoAnual: undefined,
        arrecadacaoAnual: undefined,
      });
      expect(resultado.danosHumanos?.feridos).toBe(2);
      expect(resultado.danosHumanos?.totalAfetados).toBe(2);
      expect(resultado.danosAmbientais?.poluicaoAgua).toBe(true);
      expect(resultado.danosAmbientais?.poluicaoAr).toBe(false);
      expect(resultado.danosMateriais?.linhas[0]).toMatchObject({
        discriminacao: "Unidades habitacionais",
        quantidadeDanificadas: 3,
      });
      expect(resultado.prejuizosEconomicosPublicos?.valorTotal).toBe(150);
      expect(resultado.prejuizosEconomicosPrivados?.valorTotal).toBe(200);
    });
  });

  describe("montarRespostaDmate", () => {
    it("monta secoes do DMATE e soma financeiro", () => {
      const resultado = montarRespostaDmate({
        s1_cap_superada: "sim",
        s2_ocorreu_ant: "nao",
        s4_hum_ajuda_sn: "sim",
        s4_hum_ajuda_qtd: "10",
        s4_fin_mun_sn: "sim",
        s4_fin_mun_val: "100",
        s4_fin_doacoes_sn: "sim",
        s4_fin_doacoes_val: "50",
      });

      expect(resultado.caracterizacao_emergencia?.capacidade_superada).toBe(true);
      expect(resultado.informacoes_desastre?.evento_ocorreu_anteriormente).toBe(false);
      expect(
        resultado.medidas_acoes?.recursos_humanos?.itens?.ajuda_humanitaria
      ).toEqual({ informado: true, quantidade: 10 });
      expect(
        resultado.medidas_acoes?.recursos_financeiros?.valor_financeiro_empregado
      ).toBe(150);
    });
  });

  describe("carregarCatalogoSimulado", () => {
    it("identifica formularios FIDE e DMATE pela API", async () => {
      vi.stubGlobal(
        "fetch",
        mockFetchJson([
          { id: 10, titulo: "FIDE Padrao", descricao: null, ativo: true, criado_em: "2026-01-01" },
          { id: 20, titulo: "DMATE Padrao", descricao: null, ativo: true, criado_em: "2026-01-01" },
        ])
      );

      const catalogo = await carregarCatalogoSimulado();
      expect(catalogo.fide?.id).toBe(10);
      expect(catalogo.dmate?.id).toBe(20);
    });

    it("usa fallback quando API falha", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

      const catalogo = await carregarCatalogoSimulado();
      expect(catalogo.fide?.titulo).toContain("FIDE");
      expect(catalogo.dmate?.titulo).toContain("DMATE");
    });
  });

  describe("salvarTentativaFormulario", () => {
    it("envia POST para criar tentativa", async () => {
      const fetchMock = mockFetchJson({ id: 1, status: "FINALIZADO" });
      vi.stubGlobal("fetch", fetchMock);

      await salvarTentativaFormulario({
        formularioId: 2,
        respostas: { fide: { municipio: "Recife" } },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:8080/tentativas",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer token-teste",
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("envia PUT quando tentativaId informado", async () => {
      const fetchMock = mockFetchJson({ id: 5, status: "FINALIZADO" });
      vi.stubGlobal("fetch", fetchMock);

      await salvarTentativaFormulario({
        formularioId: 2,
        tentativaId: 5,
        respostas: { fide: {} },
        status: "INICIADO",
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:8080/tentativas/5",
        expect.objectContaining({ method: "PUT" })
      );
    });
  });

  describe("listarTentativasSupervisor", () => {
    it("chama endpoint do supervisor com token", async () => {
      const tentativas = [{ id: 1 }];
      const fetchMock = mockFetchJson(tentativas);
      vi.stubGlobal("fetch", fetchMock);

      const resultado = await listarTentativasSupervisor();
      expect(resultado).toEqual(tentativas);
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:8080/tentativas/supervisor",
        expect.objectContaining({
          headers: { Authorization: "Bearer token-teste" },
        })
      );
    });
  });
});
