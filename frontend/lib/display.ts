export function getBadgeClassStatus(status: string) {
  switch (status) {
    case "FINALIZADO":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "INICIADO":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "ERRO":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export function exibirTexto(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }
  return String(valor);
}

export function exibirSimNao(valor: unknown) {
  if (valor === true || valor === "sim") return "Sim";
  if (valor === false || valor === "nao") return "Não";
  return "-";
}

export function exibirNumeroOuTexto(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }
  return typeof valor === "number" ? valor.toLocaleString("pt-BR") : String(valor);
}
