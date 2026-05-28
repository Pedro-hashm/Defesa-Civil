"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listarTentativasSupervisor, formatarDataBR, type TentativaFormulario } from "@/lib/tentativas";

type Cargo = "ADMIN" | "ALUNO" | string;

function getBadgeClass(status: string) {
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

function valorTexto(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  return String(valor);
}

function valorSimNao(valor: unknown) {
  return valor === true ? "Sim" : valor === false ? "Nao" : "-";
}

function numeroOuTexto(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  return typeof valor === "number" ? valor.toLocaleString("pt-BR") : String(valor);
}

export default function RespostasPage() {
  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [tentativas, setTentativas] = useState<TentativaFormulario[]>([]);
  const [selecionadaId, setSelecionadaId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroFormulario, setFiltroFormulario] = useState<"TODOS" | "FIDE" | "DMATE">("TODOS");
  const [filtroStatus, setFiltroStatus] = useState<"TODOS" | "INICIADO" | "FINALIZADO" | "ERRO">("TODOS");
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const usuarioStorage = localStorage.getItem("defesa-civil.usuario");
    if (usuarioStorage) {
      try {
        const usuario = JSON.parse(usuarioStorage) as { cargo?: Cargo };
        setCargo(usuario.cargo ?? null);
      } catch {
        setCargo("");
      }
    } else {
      setCargo("");
    }
  }, []);

  useEffect(() => {
    if (cargo !== "ADMIN") {
      if (cargo !== null) {
        setIsLoading(false);
      }
      return;
    }

    async function carregar() {
      setIsLoading(true);
      setErro("");
      try {
        const lista = await listarTentativasSupervisor();
        setTentativas(lista);
        setSelecionadaId((atual) => atual ?? lista[0]?.id ?? null);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar as respostas."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void carregar();
  }, [cargo]);

  const tentativasFiltradas = useMemo(() => {
    return tentativas.filter((tentativa) => {
      const textoBusca =
        tentativa.usuario.nome.toLowerCase().includes(busca.toLowerCase()) ||
        tentativa.usuario.email.toLowerCase().includes(busca.toLowerCase()) ||
        tentativa.formulario.titulo.toLowerCase().includes(busca.toLowerCase());
      const textoFormulario =
        filtroFormulario === "TODOS" ||
        (filtroFormulario === "FIDE" &&
          tentativa.formulario.titulo.toUpperCase().includes("FIDE")) ||
        (filtroFormulario === "DMATE" &&
          tentativa.formulario.titulo.toUpperCase().includes("DMATE"));
      const textoStatus =
        filtroStatus === "TODOS" || tentativa.status === filtroStatus;

      return textoBusca && textoFormulario && textoStatus;
    });
  }, [busca, filtroFormulario, filtroStatus, tentativas]);

  const selecionada =
    tentativas.find((tentativa) => tentativa.id === selecionadaId) ??
    tentativasFiltradas[0] ??
    null;

  // A API devolve JSON livre; aqui tratamos como mapa de leitura para a tela.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const respostas = (selecionada?.respostas ?? {}) as Record<string, any>;
  const isFide = selecionada?.formulario.titulo.toUpperCase().includes("FIDE");
  const isDmate = selecionada?.formulario.titulo.toUpperCase().includes("DMATE");

  if (cargo !== null && cargo !== "ADMIN") {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#003882]">
          Acesso restrito
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Respostas dos alunos
        </h1>
        <p className="mt-3 text-slate-600">
          Esta area e visivel apenas para o supervisor da plataforma.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-[#003882] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#002456]"
        >
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#003882]">
            Supervisor
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Respostas dos alunos
          </h1>
          <p className="mt-1 text-base text-slate-500">
            Consulte as tentativas enviadas no FIDE e no DMATE.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/simulador/fide-dmate"
            className="inline-flex items-center rounded-lg border border-[#003882] px-4 py-2.5 text-sm font-bold text-[#003882] transition hover:bg-[#003882]/5"
          >
            Abrir simulado
          </Link>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Buscar
          </span>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Aluno, email ou formulario"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Formulario
          </span>
          <select
            value={filtroFormulario}
            onChange={(e) =>
              setFiltroFormulario(e.target.value as "TODOS" | "FIDE" | "DMATE")
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20"
          >
            <option value="TODOS">Todos</option>
            <option value="FIDE">FIDE</option>
            <option value="DMATE">DMATE</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Status
          </span>
          <select
            value={filtroStatus}
            onChange={(e) =>
              setFiltroStatus(
                e.target.value as "TODOS" | "INICIADO" | "FINALIZADO" | "ERRO"
              )
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20"
          >
            <option value="TODOS">Todos</option>
            <option value="FINALIZADO">Finalizado</option>
            <option value="INICIADO">Iniciado</option>
            <option value="ERRO">Erro</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Carregando respostas...
        </div>
      ) : erro ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      ) : tentativasFiltradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-slate-900">
            Nenhuma resposta encontrada
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Ajuste os filtros ou aguarde novos envios.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">
                {tentativasFiltradas.length} tentativa(s)
              </p>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-2">
              {tentativasFiltradas.map((tentativa) => {
                const selecionadaAtual = tentativa.id === selecionada?.id;

                return (
                  <button
                    key={tentativa.id}
                    type="button"
                    onClick={() => setSelecionadaId(tentativa.id)}
                    className={`mb-2 w-full rounded-xl border p-4 text-left transition ${
                      selecionadaAtual
                        ? "border-[#003882] bg-blue-50"
                        : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {tentativa.usuario.nome}
                        </p>
                        <p className="text-sm text-slate-500">
                          {tentativa.formulario.titulo}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${getBadgeClass(
                          tentativa.status
                        )}`}
                      >
                        {tentativa.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{valorTexto(tentativa.usuario.email)}</span>
                      <span>•</span>
                      <span>{formatarDataBR(tentativa.iniciado_em)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            {selecionada ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#003882]">
                      Detalhes da tentativa
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                      {selecionada.usuario.nome}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selecionada.usuario.email}
                    </p>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-sm font-semibold ${getBadgeClass(
                      selecionada.status
                    )}`}
                  >
                    {selecionada.status}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Formulario
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {selecionada.formulario.titulo}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Inicio
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {formatarDataBR(selecionada.iniciado_em)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Finalizacao
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {formatarDataBR(selecionada.finalizado_em)}
                    </p>
                  </div>
                </div>

                {isFide ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Resumo FIDE</h3>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Identificacao
                        </p>
                        <p className="mt-2 font-medium text-slate-900">
                          {valorTexto(respostas.identificacao?.municipio)}
                        </p>
                        <p className="text-sm text-slate-500">
                          UF {valorTexto(respostas.identificacao?.uf)} • IBGE{" "}
                          {valorTexto(respostas.identificacao?.codigoIbge)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          COBRADE
                        </p>
                        <p className="mt-2 font-medium text-slate-900">
                          {valorTexto(respostas.tipificacao?.cobrade)}
                        </p>
                        <p className="text-sm text-slate-500">
                          {valorTexto(respostas.dataOcorrencia?.dia)}/
                          {valorTexto(respostas.dataOcorrencia?.mes)}/
                          {valorTexto(respostas.dataOcorrencia?.ano)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Danos humanos
                        </p>
                        <p className="mt-2 font-medium text-slate-900">
                          Total {numeroOuTexto(respostas.danosHumanos?.totalAfetados)}
                        </p>
                        <p className="text-sm text-slate-500">
                          Desabrigados {numeroOuTexto(respostas.danosHumanos?.desabrigados)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Prejuizos publicos
                        </p>
                        <p className="mt-2 font-medium text-slate-900">
                          R$ {numeroOuTexto(respostas.prejuizosEconomicosPublicos?.valorTotal)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Prejuizos privados
                        </p>
                        <p className="mt-2 font-medium text-slate-900">
                          R$ {numeroOuTexto(respostas.prejuizosEconomicosPrivados?.valorTotal)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Area afetada
                        </p>
                        <p className="mt-2 font-medium text-slate-900">
                          {valorTexto(
                            respostas.areaPopulacaoAfetada?.descricao_areas_afetadas
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {isDmate ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Resumo DMATE</h3>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Emergencia
                        </p>
                        <p className="mt-2 font-medium text-slate-900">
                          Capacidade superada:{" "}
                          {valorSimNao(respostas.caracterizacao_emergencia?.capacidade_superada)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Historico
                        </p>
                        <p className="mt-2 font-medium text-slate-900">
                          Ocorreu antes:{" "}
                          {valorSimNao(respostas.informacoes_desastre?.evento_ocorreu_anteriormente)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Gestao
                        </p>
                        <p className="mt-2 font-medium text-slate-900">
                          Mapeamento:{" "}
                          {valorSimNao(respostas.capacidade_gerencial?.mapeamento_areas)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Recursos humanos
                        </p>
                        <p className="mt-2 font-medium text-slate-900">
                          {numeroOuTexto(
                            respostas.medidas_acoes?.recursos_humanos?.itens
                              ? Object.keys(
                                  respostas.medidas_acoes.recursos_humanos.itens as Record<string, unknown>
                                ).length
                              : 0
                          )} itens
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Recursos materiais
                        </p>
                        <p className="mt-2 font-medium text-slate-900">
                          {numeroOuTexto(
                            respostas.medidas_acoes?.recursos_materiais?.itens
                              ? Object.keys(
                                  respostas.medidas_acoes.recursos_materiais.itens as Record<string, unknown>
                                ).length
                              : 0
                          )} itens
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Recursos financeiros
                        </p>
                        <p className="mt-2 font-medium text-slate-900">
                          R$ {numeroOuTexto(
                            respostas.medidas_acoes?.recursos_financeiros?.valor_financeiro_empregado
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                    Ver resposta completa
                  </summary>
                  <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-6 text-slate-100">
                    {JSON.stringify(respostas, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-slate-500">
                Selecione uma tentativa para ver os detalhes.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
