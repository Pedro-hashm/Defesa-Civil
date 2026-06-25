import { parseRespostas } from "@/lib/json";
import type { FormularioResumo } from "@/lib/tentativas";

export type TipoFormulario = "FIDE" | "DMATE" | "RECURSOS" | "FIDE_DMATE" | "DESCONHECIDO";

export function contemTermoFormulario(
  formulario: Pick<FormularioResumo, "titulo" | "descricao" | "estrutura">,
  ...termos: string[]
) {
  const texto = [
    formulario.titulo,
    formulario.descricao ?? "",
    typeof formulario.estrutura === "object"
      ? JSON.stringify(formulario.estrutura)
      : "",
  ]
    .join(" ")
    .toUpperCase();

  return termos.some((termo) => texto.includes(termo.toUpperCase()));
}

export function extrairRespostasObjeto(respostas: unknown): Record<string, unknown> {
  return parseRespostas(respostas);
}

export function detectarTipoFormulario(
  titulo?: string,
  respostas?: unknown
): TipoFormulario {
  const obj = extrairRespostasObjeto(respostas);
  const tituloUpper = titulo?.toUpperCase() ?? "";

  if (obj.solicitacao_recursos) {
    return "RECURSOS";
  }

  const temFide = Boolean(obj.fide || obj.identificacao);
  const temDmate = Boolean(obj.dmate || obj.caracterizacao_emergencia);

  if (temFide && temDmate) {
    return "FIDE_DMATE";
  }
  if (temFide || tituloUpper.includes("FIDE")) {
    return "FIDE";
  }
  if (temDmate || tituloUpper.includes("DMATE")) {
    return "DMATE";
  }
  if (
    tituloUpper.includes("RECURSO") ||
    tituloUpper.includes("SOLICITA")
  ) {
    return "RECURSOS";
  }

  return "DESCONHECIDO";
}

export function rotaEdicaoTentativa(
  tentativaId: number,
  tipo: TipoFormulario
): string {
  if (tipo === "RECURSOS") {
    return `/simulador/solicitar-recursos?edit=${tentativaId}`;
  }
  return `/simulador/fide-dmate?edit=${tentativaId}`;
}

export function extrairRaizRecursos(respostas: unknown): Record<string, unknown> {
  const obj = extrairRespostasObjeto(respostas);
  if (obj.solicitacao_recursos && typeof obj.solicitacao_recursos === "object") {
    return obj.solicitacao_recursos as Record<string, unknown>;
  }
  if (obj.uf || obj.cobrade || obj.tipo_solicitacao) {
    return obj;
  }
  return {};
}

export function resumoRecursos(respostas: unknown) {
  const raiz = extrairRaizRecursos(respostas);
  const itens = Array.isArray(raiz.itens_meta) ? raiz.itens_meta : [];

  const valorTotal = itens.reduce((total, item) => {
    if (!item || typeof item !== "object") return total;
    const linha = item as Record<string, unknown>;
    const qtde = Number(linha.quantidade) || 0;
    const valorUnitario = Number(linha.valor_unitario) || 0;
    return total + qtde * valorUnitario;
  }, 0);

  return {
    raiz,
    valorTotal,
    qtdItens: itens.length,
  };
}

export function rotuloTipoFormulario(tipo: TipoFormulario): string {
  switch (tipo) {
    case "FIDE_DMATE":
      return "FIDE + DMATE";
    case "RECURSOS":
      return "Solicitação de Recursos";
    case "FIDE":
      return "FIDE";
    case "DMATE":
      return "DMATE";
    default:
      return "Formulário";
  }
}
