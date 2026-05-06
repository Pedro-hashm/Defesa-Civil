import { StatusTentativa } from "@prisma/client";

/**
 * Núcleo comum aos processos FIDE analisados (Vertentes, Garanhuns, Limoeiro, Araripina).
 * O seed `FIDE — Padrão` descreve 8 seções com chaves em snake_case para o front (ex.: codigo_ibge).
 * Campos específicos por município/processos subsequentes podem ir em `extras`.
 */
export interface RespostasFIDE {
  identificacao?: {
    uf?: string;
    municipio?: string;
    codigoIbge?: string;
    populacao?: number;
    pibAnual?: number;
    orcamentoAnual?: number;
    arrecadacaoAnual?: number;
    receitaCorrenteLiquidaMensal?: number;
    receitaCorrenteLiquidaAnual?: number;
  };
  tipificacao?: {
    cobrade?: string;
    denominacao?: string;
  };
  dataOcorrencia?: {
    dia?: number;
    mes?: number;
    ano?: number;
    horario?: string;
  };
  areaPopulacaoAfetada?: {
    tiposOcupacao?: string[];
    descricao?: string;
    /** Matriz/tipos de ocupação (ex.: flags ou estrutura acordada com o template). */
    matriz_ocupacao?: unknown;
    /**
     * Polígonos do mapa no front: enviar GeoJSON (ex.: FeatureCollection) em POST /tentativas.
     * Sem PostGIS nem colunas geometry no banco — apenas JSON em `respostas`.
     */
    mapa_selecao?: unknown;
    descricao_areas_afetadas?: string;
  };
  causasEfeitos?: string;
  danosHumanos?: {
    mortos?: number;
    feridos?: number;
    enfermos?: number;
    desabrigados?: number;
    desalojados?: number;
    desaparecidos?: number;
    outrosAfetados?: number;
    totalAfetados?: number;
    descricao?: string;
  };
  danosMateriais?: {
    linhas?: Array<{
      discriminacao?: string;
      quantidadeDanificadas?: number;
      quantidadeDestruidas?: number;
      valorReais?: number;
    }>;
    descricao?: string;
  };
  danosAmbientais?: {
    poluicaoAgua?: boolean;
    poluicaoAr?: boolean;
    poluicaoSolo?: boolean;
    exaurimentoHidrico?: boolean;
    incendiosApaApp?: boolean;
    descricaoPopulacaoAtingida?: string;
    descricaoAreaAtingida?: string;
    descricao?: string;
  };
  prejuizosEconomicosPublicos?: {
    valorTotal?: number;
    porServico?: Record<string, number>;
    descricao?: string;
  };
  prejuizosEconomicosPrivados?: {
    valorTotal?: number;
    agricultura?: number;
    pecuaria?: number;
    industria?: number;
    comercio?: number;
    servicos?: number;
    descricao?: string;
  };
  instituicaoInformante?: {
    nomeResponsavel?: string;
    cargo?: string;
    telefone?: string;
    email?: string;
    dataPreenchimento?: string;
  };
  /** DMATE, relatório fotográfico, solicitação de recursos (OCP/metas), FVD, etc. */
  extras?: Record<string, unknown>;
}

/**
 * Respostas do template DMATE (paralelo ao FIDE). Estrutura flexível conforme `secoes_dmate` no seed.
 */
export interface RespostasDMATE {
  caracterizacao_emergencia?: Record<string, unknown>;
  informacoes_desastre?: Record<string, unknown>;
  capacidade_gerencial?: Record<string, unknown>;
  medidas_acoes?: {
    recursos_humanos?: Record<string, unknown>;
    recursos_materiais?: Record<string, unknown>;
    recursos_financeiros?: Record<string, unknown>;
  };
  instituicao_informante?: Record<string, unknown>;
  extras?: Record<string, unknown>;
}

export interface CreateTentativaDTO {
  formulario_id: number;
  respostas: RespostasFIDE | RespostasDMATE | Record<string, unknown>;
  status?: StatusTentativa;
  erros?: Record<string, unknown> | null;
}

export interface UpdateTentativaDTO {
  respostas?: RespostasFIDE | RespostasDMATE | Record<string, unknown>;
  status?: StatusTentativa;
  erros?: Record<string, unknown> | null;
}
