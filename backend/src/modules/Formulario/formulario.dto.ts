import { StatusTentativa } from "@prisma/client";

/**
 * Núcleo comum aos processos FIDE analisados (Vertentes, Garanhuns, Limoeiro, Araripina).
 * Campos específicos por município/processos subsequentes devem ir em `extras`.
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

export interface CreateTentativaDTO {
  formulario_id: number;
  respostas: RespostasFIDE | Record<string, unknown>;
  status?: StatusTentativa;
  erros?: Record<string, unknown> | null;
}

export interface UpdateTentativaDTO {
  respostas?: RespostasFIDE | Record<string, unknown>;
  status?: StatusTentativa;
  erros?: Record<string, unknown> | null;
}
