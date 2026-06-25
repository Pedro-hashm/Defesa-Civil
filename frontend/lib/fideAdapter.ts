const MAT_DISCRIMINACAO_MAP: Record<string, string> = {
  "Unidades habitacionais": "habitacionais",
  "Instalacoes publicas de saude": "saude",
  "Instalacoes publicas de ensino": "ensino",
  "Instalacoes publicas prestadoras de outros servicos": "outros_servicos",
  "Instalacoes publicas de uso comunitario": "comunitario",
  "Obras de infraestrutura publica": "infraestrutura",
};

type FideNested = Record<string, unknown>;

export function adaptarFideParaPlano(d: FideNested): Record<string, unknown> {
  const identificacao = d.identificacao as Record<string, unknown> | undefined;
  if (!d || !identificacao) return d || {};

  const areaPopulacaoAfetada = d.areaPopulacaoAfetada as
    | Record<string, unknown>
    | undefined;
  const m = (areaPopulacaoAfetada?.matriz_ocupacao as Record<string, unknown>) || {};
  const danosMateriais = d.danosMateriais as Record<string, unknown> | undefined;
  const matLinhas = (danosMateriais?.linhas as Array<Record<string, unknown>>) || [];

  const flatMat: Record<string, unknown> = {};
  matLinhas.forEach((linha) => {
    const key = MAT_DISCRIMINACAO_MAP[String(linha.discriminacao)];
    if (key) {
      flatMat[`mat_${key}_dan`] = linha.quantidadeDanificadas || 0;
      flatMat[`mat_${key}_des`] = linha.quantidadeDestruidas || 0;
      flatMat[`mat_${key}_val`] = linha.valorReais || 0;
    }
  });

  const tipificacao = d.tipificacao as Record<string, unknown> | undefined;
  const dataOcorrencia = d.dataOcorrencia as Record<string, unknown> | undefined;
  const danosHumanos = d.danosHumanos as Record<string, unknown> | undefined;
  const danosAmbientais = d.danosAmbientais as Record<string, unknown> | undefined;
  const prejuizosPublicos = d.prejuizosEconomicosPublicos as
    | Record<string, unknown>
    | undefined;
  const porServicoPublico = (prejuizosPublicos?.porServico as Record<string, unknown>) || {};
  const prejuizosPrivados = d.prejuizosEconomicosPrivados as
    | Record<string, unknown>
    | undefined;

  return {
    uf: identificacao.uf,
    municipio: identificacao.municipio,
    codigo_ibge: identificacao.codigoIbge,
    populacao: identificacao.populacao,
    pib_anual: identificacao.pibAnual,
    orcamento_anual: identificacao.orcamentoAnual,
    arrecadacao_anual: identificacao.arrecadacaoAnual,
    cobrade: tipificacao?.cobrade,
    dia: dataOcorrencia?.dia,
    mes: dataOcorrencia?.mes,
    ano: dataOcorrencia?.ano,
    horario: dataOcorrencia?.horario,
    causas_efeitos: d.causasEfeitos,
    descricao_areas: areaPopulacaoAfetada?.descricao_areas_afetadas,
    ocupacao_residencial: m.residencial,
    ocupacao_comercial: m.comercial,
    ocupacao_industrial: m.industrial,
    "ocupacao_agrícola": m.agricola || m.agrícola,
    "ocupacao_pecuária": m.pecuaria || m.pecuária,
    ocupacao_extrativismo_vegetal: m.extrativismo_vegetal,
    ocupacao_reserva_florestal_ou_apa: m.reserva_florestal_ou_apa,
    ocupacao_mineração: m.mineracao || m.mineração,
    "ocupacao_turismo_e_outras": m.turismo_e_outras,
    humanos_mortos: danosHumanos?.mortos,
    humanos_feridos: danosHumanos?.feridos,
    humanos_enfermos: danosHumanos?.enfermos,
    humanos_desabrigados: danosHumanos?.desabrigados,
    humanos_desalojados: danosHumanos?.desalojados,
    humanos_desaparecidos: danosHumanos?.desaparecidos,
    humanos_outros: danosHumanos?.outrosAfetados,
    desc_humanos: danosHumanos?.descricao,
    ...flatMat,
    desc_materiais: danosMateriais?.descricao,
    amb_agua_sn: danosAmbientais?.poluicaoAgua ? "sim" : "nao",
    amb_ar_sn: danosAmbientais?.poluicaoAr ? "sim" : "nao",
    amb_solo_sn: danosAmbientais?.poluicaoSolo ? "sim" : "nao",
    amb_hidrico_sn: danosAmbientais?.exaurimentoHidrico ? "sim" : "nao",
    amb_incendio_sn: danosAmbientais?.incendiosApaApp ? "sim" : "nao",
    amb_agua_pop: danosAmbientais?.descricaoPopulacaoAtingida,
    amb_ar_pop: danosAmbientais?.descricaoPopulacaoAtingida,
    amb_solo_pop: danosAmbientais?.descricaoPopulacaoAtingida,
    amb_hidrico_pop: danosAmbientais?.descricaoPopulacaoAtingida,
    amb_incendio_area: danosAmbientais?.descricaoPopulacaoAtingida,
    desc_ambientais: danosAmbientais?.descricao,
    prej_pub_agua: porServicoPublico.agua,
    prej_pub_lixo: porServicoPublico.lixo,
    prej_pub_saude: porServicoPublico.saude,
    prej_pub_ensino: porServicoPublico.ensino,
    prej_pub_esgoto: porServicoPublico.esgoto,
    prej_pub_energia: porServicoPublico.energia,
    prej_pub_telecom: porServicoPublico.telecom,
    prej_pub_seguranca: porServicoPublico.seguranca,
    prej_pub_transporte: porServicoPublico.transporte,
    desc_prej_pub: prejuizosPublicos?.descricao,
    prej_priv_agricultura: prejuizosPrivados?.agricultura,
    prej_priv_pecuaria: prejuizosPrivados?.pecuaria,
    prej_priv_industria: prejuizosPrivados?.industria,
    prej_priv_comercio: prejuizosPrivados?.comercio,
    prej_priv_servicos: prejuizosPrivados?.servicos,
    desc_prej_priv: prejuizosPrivados?.descricao,
  };
}
