import { API_URL } from "@/lib/api";

export type FormularioResumo = {
  id: number;
  titulo: string;
  descricao?: string | null;
  ativo: boolean;
  criado_em: string;
  estrutura?: unknown;
};

export type TentativaStatus = "INICIADO" | "FINALIZADO" | "ERRO";

export type TentativaFormulario = {
  id: number;
  usuario_id: number;
  formulario_id: number;
  respostas: Record<string, unknown>;
  erros: unknown;
  status: TentativaStatus;
  iniciado_em: string;
  finalizado_em: string | null;
  usuario: {
    id: number;
    nome: string;
    email: string;
    cargo: "ADMIN" | "ALUNO" | string;
  };
  formulario: {
    id: number;
    titulo: string;
    descricao?: string | null;
  };
};

export type CatalogoSimulado = {
  fide?: FormularioResumo;
  dmate?: FormularioResumo;
  recursos?: FormularioResumo;
};

export type FlatFormData = Record<string, string>;

type ApiError = {
  error?: string;
  message?: string;
};

const FALLBACK_FORMULARIOS: CatalogoSimulado = {
  fide: {
    id: 1,
    titulo: "FIDE - Padrao (SEDEC/MIDR)",
    descricao: null,
    ativo: true,
    criado_em: new Date().toISOString(),
  },
  dmate: {
    id: 2,
    titulo: "DMATE - Padrao (SEDEC/MIDR)",
    descricao: null,
    ativo: true,
    criado_em: new Date().toISOString(),
  },
  recursos: {
    id: 3,
    titulo: "Solicitacao de Recursos - Padrao (SEDEC/MIDR)",
    descricao: null,
    ativo: true,
    criado_em: new Date().toISOString(),
  },
};

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("defesa-civil.token");
}

function getHeaders(contentType = false) {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (contentType) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | ApiError;

  if (!response.ok) {
    throw new Error(
      data.error || data.message || "Nao foi possivel concluir a solicitacao."
    );
  }

  return data as T;
}

function contemDocumento(formulario: FormularioResumo, termo: string) {
  const texto = [
    formulario.titulo,
    formulario.descricao ?? "",
    typeof formulario.estrutura === "object"
      ? JSON.stringify(formulario.estrutura)
      : "",
  ]
    .join(" ")
    .toUpperCase();

  return texto.includes(termo.toUpperCase());
}

function valorNumerico(valor: string | undefined) {
  if (valor === undefined) {
    return undefined;
  }

  const normalizado = valor.replace(",", ".").trim();
  if (!normalizado) {
    return undefined;
  }

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : undefined;
}

function valorTexto(valor: string | undefined) {
  const texto = valor?.trim();
  return texto ? texto : undefined;
}

function valorSimNao(valor: string | undefined) {
  return valor === "sim";
}

export async function carregarCatalogoSimulado(): Promise<CatalogoSimulado> {
  try {
    const response = await fetch(`${API_URL}/formularios`, {
      headers: getHeaders(),
    });
    const formularios = await parseResponse<FormularioResumo[]>(response);

    const fide =
      formularios.find((formulario) => contemDocumento(formulario, "FIDE")) ??
      FALLBACK_FORMULARIOS.fide;
    const dmate =
      formularios.find((formulario) => contemDocumento(formulario, "DMATE")) ??
      FALLBACK_FORMULARIOS.dmate;
    const recursos =
      formularios.find(
        (formulario) =>
          contemDocumento(formulario, "SOLICITACAO_RECURSOS") ||
          contemDocumento(formulario, "RECURSOS") ||
          contemDocumento(formulario, "SOLICITA")
      ) ?? FALLBACK_FORMULARIOS.recursos;

    return { fide, dmate, recursos };
  } catch {
    return FALLBACK_FORMULARIOS;
  }
}

export async function salvarTentativaFormulario(params: {
  formularioId: number;
  respostas: Record<string, unknown>;
  status?: TentativaStatus;
  tentativaId?: number;
  erros?: Record<string, unknown> | null;
}) {
  const response = await fetch(
    `${API_URL}/tentativas${params.tentativaId ? `/${params.tentativaId}` : ""}`,
    {
      method: params.tentativaId ? "PUT" : "POST",
      headers: getHeaders(true),
      body: JSON.stringify({
        formulario_id: params.formularioId,
        respostas: params.respostas,
        status: params.status ?? "FINALIZADO",
        erros: params.erros,
      }),
    }
  );

  return parseResponse<TentativaFormulario>(response);
}

export async function listarTentativasSupervisor() {
  const response = await fetch(`${API_URL}/tentativas/supervisor`, {
    headers: getHeaders(),
  });

  return parseResponse<TentativaFormulario[]>(response);
}

export async function obterIdFormularioPorTermos(
  ...termos: string[]
): Promise<number> {
  const response = await fetch(`${API_URL}/formularios`, {
    headers: getHeaders(),
  });
  const formularios = await parseResponse<FormularioResumo[]>(response);

  for (const termo of termos) {
    const encontrado = formularios.find((formulario) =>
      contemDocumento(formulario, termo)
    );
    if (encontrado) {
      return encontrado.id;
    }
  }

  throw new Error(
    `Formulario nao encontrado no backend (${termos.join(", ")}).`
  );
}

export async function obterIdFormularioRecursos(): Promise<number> {
  try {
    return await obterIdFormularioPorTermos(
      "SOLICITACAO_RECURSOS",
      "RECURSOS",
      "SOLICITA"
    );
  } catch {
    return FALLBACK_FORMULARIOS.recursos?.id ?? 3;
  }
}

export function formatarDataBR(valor?: string | null) {
  if (!valor) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}

export function montarRespostaFide(fideData: FlatFormData) {
  const mapaOcupacao = {
    residencial: valorTexto(fideData.ocupacao_residencial),
    comercial: valorTexto(fideData.ocupacao_comercial),
    industrial: valorTexto(fideData.ocupacao_industrial),
    agricola: valorTexto(fideData.ocupacao_agricola),
    pecuaria: valorTexto(fideData.ocupacao_pecuaria),
    extrativismo_vegetal: valorTexto(fideData.ocupacao_extrativismo_vegetal),
    reserva_florestal_ou_apa: valorTexto(
      fideData.ocupacao_reserva_florestal_ou_apa
    ),
    mineracao: valorTexto(fideData.ocupacao_mineracao),
    turismo_e_outras: valorTexto(fideData.ocupacao_turismo_e_outras),
  };

  const humanos = {
    mortos: valorNumerico(fideData.humanos_mortos),
    feridos: valorNumerico(fideData.humanos_feridos),
    enfermos: valorNumerico(fideData.humanos_enfermos),
    desabrigados: valorNumerico(fideData.humanos_desabrigados),
    desalojados: valorNumerico(fideData.humanos_desalojados),
    desaparecidos: valorNumerico(fideData.humanos_desaparecidos),
    outrosAfetados: valorNumerico(fideData.humanos_outros),
  };

  const materiais = [
    { discriminacao: "Unidades habitacionais", base: "habitacionais" },
    { discriminacao: "Instalacoes publicas de saude", base: "saude" },
    { discriminacao: "Instalacoes publicas de ensino", base: "ensino" },
    {
      discriminacao: "Instalacoes publicas prestadoras de outros servicos",
      base: "outros_servicos",
    },
    {
      discriminacao: "Instalacoes publicas de uso comunitario",
      base: "comunitario",
    },
    { discriminacao: "Obras de infraestrutura publica", base: "infraestrutura" },
  ].map((item) => ({
    discriminacao: item.discriminacao,
    quantidadeDanificadas: valorNumerico(
      fideData[`mat_${item.base}_dan`]
    ),
    quantidadeDestruidas: valorNumerico(fideData[`mat_${item.base}_des`]),
    valorReais: valorNumerico(fideData[`mat_${item.base}_val`]),
  }));

  const prejuizosPublicos = {
    saude: valorNumerico(fideData.prej_pub_saude),
    agua: valorNumerico(fideData.prej_pub_agua),
    esgoto: valorNumerico(fideData.prej_pub_esgoto),
    lixo: valorNumerico(fideData.prej_pub_lixo),
    energia: valorNumerico(fideData.prej_pub_energia),
    telecom: valorNumerico(fideData.prej_pub_telecom),
    transporte: valorNumerico(fideData.prej_pub_transporte),
    seguranca: valorNumerico(fideData.prej_pub_seguranca),
    ensino: valorNumerico(fideData.prej_pub_ensino),
  };

  const prejuizosPrivados = {
    agricultura: valorNumerico(fideData.prej_priv_agricultura),
    pecuaria: valorNumerico(fideData.prej_priv_pecuaria),
    industria: valorNumerico(fideData.prej_priv_industria),
    comercio: valorNumerico(fideData.prej_priv_comercio),
    servicos: valorNumerico(fideData.prej_priv_servicos),
  };

  return {
    identificacao: {
      uf: valorTexto(fideData.uf),
      municipio: valorTexto(fideData.municipio),
      codigoIbge: valorTexto(fideData.codigo_ibge),
      populacao: valorNumerico(fideData.populacao),
      pibAnual: valorNumerico(fideData.pib_anual),
      orcamentoAnual: valorNumerico(fideData.orcamento_anual),
      arrecadacaoAnual: valorNumerico(fideData.arrecadacao_anual),
    },
    tipificacao: {
      cobrade: valorTexto(fideData.cobrade),
      denominacao: valorTexto(fideData.cobrade)
        ? "Preenchimento automatico"
        : undefined,
    },
    dataOcorrencia: {
      dia: valorNumerico(fideData.dia),
      mes: valorNumerico(fideData.mes),
      ano: valorNumerico(fideData.ano),
      horario: valorTexto(fideData.horario),
    },
    areaPopulacaoAfetada: {
      matriz_ocupacao: mapaOcupacao,
      mapa_selecao: null,
      descricao_areas_afetadas: valorTexto(fideData.descricao_areas),
    },
    causasEfeitos: valorTexto(fideData.causas_efeitos),
    danosHumanos: {
      ...humanos,
      totalAfetados: Object.values(humanos).reduce(
        (total, valor) => total + (valor ?? 0),
        0
      ),
      descricao: valorTexto(fideData.desc_humanos),
    },
    danosMateriais: {
      linhas: materiais,
      descricao: valorTexto(fideData.desc_materiais),
    },
    danosAmbientais: {
      poluicaoAgua: valorSimNao(fideData.amb_agua_sn),
      poluicaoAr: valorSimNao(fideData.amb_ar_sn),
      poluicaoSolo: valorSimNao(fideData.amb_solo_sn),
      exaurimentoHidrico: valorSimNao(fideData.amb_hidrico_sn),
      incendiosApaApp: valorSimNao(fideData.amb_incendio_sn),
      descricaoPopulacaoAtingida: valorTexto(
        [
          fideData.amb_agua_pop,
          fideData.amb_ar_pop,
          fideData.amb_solo_pop,
          fideData.amb_hidrico_pop,
        ]
          .filter(Boolean)
          .join(", ")
      ),
      descricaoAreaAtingida: valorTexto(fideData.amb_incendio_area),
      descricao: valorTexto(fideData.desc_ambientais),
    },
    prejuizosEconomicosPublicos: {
      valorTotal: Object.values(prejuizosPublicos).reduce(
        (total, valor) => total + (valor ?? 0),
        0
      ),
      porServico: prejuizosPublicos,
      descricao: valorTexto(fideData.desc_prej_pub),
    },
    prejuizosEconomicosPrivados: {
      valorTotal: Object.values(prejuizosPrivados).reduce(
        (total, valor) => total + (valor ?? 0),
        0
      ),
      ...prejuizosPrivados,
      descricao: valorTexto(fideData.desc_prej_priv),
    },
    instituicaoInformante: {
      dataPreenchimento: new Date().toISOString(),
    },
  };
}

export function montarRespostaDmate(dmateData: FlatFormData) {
  const recursosHumanos = [
    { chave: "ajuda", campo: "ajuda_humanitaria" },
    { chave: "saude_pub", campo: "apoio_saude_publica" },
    { chave: "medica", campo: "assistencia_medica" },
    { chave: "aval_danos", campo: "avaliacao_danos" },
    { chave: "busca", campo: "busca_resgate_salvamento" },
    { chave: "outros_hum", campo: "outros" },
    { chave: "comunicacao", campo: "comunicacao_social" },
    { chave: "reabilitacao", campo: "reabilitacao_cenarios" },
    { chave: "seguranca", campo: "seguranca_publica" },
  ].reduce<Record<string, unknown>>((acc, item) => {
    acc[item.campo] = {
      informado: valorSimNao(dmateData[`s4_hum_${item.chave}_sn`]),
      quantidade: valorNumerico(dmateData[`s4_hum_${item.chave}_qtd`]),
    };
    return acc;
  }, {});

  const recursosMateriais = [
    { chave: "agua", campo: "agua_alimentos_medicamentos" },
    { chave: "maquinas", campo: "equipamentos_maquinas" },
    { chave: "transportes", campo: "transportes" },
    { chave: "limpeza", campo: "material_limpeza" },
    { chave: "uso_pessoal", campo: "material_uso_pessoal" },
    { chave: "outros_mat", campo: "outros" },
  ].reduce<Record<string, unknown>>((acc, item) => {
    acc[item.campo] = {
      informado: valorSimNao(dmateData[`s4_mat_${item.chave}_sn`]),
      quantidade: valorNumerico(dmateData[`s4_mat_${item.chave}_qtd`]),
    };
    return acc;
  }, {});

  const recursosFinanceiros = [
    { chave: "mun", campo: "fonte_municipal" },
    { chave: "extra_mun", campo: "fonte_extra_municipal" },
    { chave: "doacoes", campo: "doacoes" },
    { chave: "outras", campo: "outras_fontes" },
  ].reduce<Record<string, unknown>>((acc, item) => {
    acc[item.campo] = {
      informado: valorSimNao(dmateData[`s4_fin_${item.chave}_sn`]),
      valor: valorNumerico(dmateData[`s4_fin_${item.chave}_val`]),
    };
    return acc;
  }, {});

  const valorTotalFinanceiro = [
    dmateData["s4_fin_mun_val"],
    dmateData["s4_fin_extra_mun_val"],
    dmateData["s4_fin_doacoes_val"],
    dmateData["s4_fin_outras_val"],
  ].reduce((total, valor) => total + (valorNumerico(valor) ?? 0), 0);

  return {
    caracterizacao_emergencia: {
      capacidade_superada: valorSimNao(dmateData.s1_cap_superada),
      capacidade_resposta_comprometida: valorSimNao(dmateData.s1_cap_comprometida),
      prejuizos_causados_desastre: valorSimNao(dmateData.s1_prej_causados),
      prejuizos_separados: valorSimNao(dmateData.s1_prej_separados),
      informe_resumido: valorTexto(dmateData.s1_informe_resumido),
    },
    informacoes_desastre: {
      evento_ocorreu_anteriormente: valorSimNao(dmateData.s2_ocorreu_ant),
      evento_anual: valorSimNao(dmateData.s2_ocorre_anual),
      acoes_preventivas_justificativa: valorTexto(dmateData.s2_acoes_preventivas),
    },
    capacidade_gerencial: {
      mapeamento_areas: valorSimNao(dmateData.s3_mapeamento),
      orgao_defesa_civil: valorSimNao(dmateData.s3_orgao_dc),
      plano_contingencia: valorSimNao(dmateData.s3_plano_cont),
      previsao_loa: valorSimNao(dmateData.s3_recurso_loa),
      inclusao_ppa: valorSimNao(dmateData.s3_inclusao_ppa),
      simulados_realizados: valorSimNao(dmateData.s3_simulados),
      apoio_estadual: valorSimNao(dmateData.s3_apoio_est),
      dificuldades_gestao: valorTexto(dmateData.s3_dificuldades),
    },
    medidas_acoes: {
      recursos_humanos: {
        itens: recursosHumanos,
        descricao: valorTexto(dmateData.s4_desc_humanos),
      },
      recursos_materiais: {
        itens: recursosMateriais,
        descricao: valorTexto(dmateData.s4_desc_materiais),
      },
      recursos_financeiros: {
        itens: recursosFinanceiros,
        valor_financeiro_empregado: valorTotalFinanceiro,
        descricao: valorTexto(dmateData.s4_desc_financeiros),
      },
    },
    instituicao_informante: {
      data_preenchimento: new Date().toISOString(),
    },
  };
}
