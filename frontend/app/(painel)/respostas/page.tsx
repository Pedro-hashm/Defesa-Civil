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

// Adaptado para ler booleanos (antigo) e "sim"/"nao" (novo formato)
function valorSimNao(valor: unknown) {
  if (valor === true || valor === "sim") return "Sim";
  if (valor === false || valor === "nao") return "Não";
  return "-";
}

function numeroOuTexto(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }
  return typeof valor === "number" ? valor.toLocaleString("pt-BR") : String(valor);
}

// Extrator Profundo de JSON
function parseRespostas(respostas: unknown): Record<string, any> {
  if (typeof respostas === 'string') {
      try { return parseRespostas(JSON.parse(respostas)); } 
      catch { return {}; }
  }
  return (respostas as Record<string, any>) || {};
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modoErro, setModoErro] = useState(false);
  const [textoErro, setTextoErro] = useState("");

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
      if (cargo !== null) setIsLoading(false);
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
        setErro(error instanceof Error ? error.message : "Nao foi possivel carregar as respostas.");
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
        (filtroFormulario === "FIDE" && tentativa.formulario.titulo.toUpperCase().includes("FIDE")) ||
        (filtroFormulario === "DMATE" && tentativa.formulario.titulo.toUpperCase().includes("DMATE"));
      const textoStatus = filtroStatus === "TODOS" || tentativa.status === filtroStatus;

      return textoBusca && textoFormulario && textoStatus;
    });
  }, [busca, filtroFormulario, filtroStatus, tentativas]);

  const selecionada =
    tentativas.find((tentativa) => tentativa.id === selecionadaId) ??
    tentativasFiltradas[0] ??
    null;

  useEffect(() => {
    setModoErro(false);
    setTextoErro(selecionada?.erros ? String(selecionada.erros) : "");
  }, [selecionada?.id]);

  const handleAvaliar = async (novoStatus: "FINALIZADO" | "ERRO") => {
    if (novoStatus === "ERRO" && !textoErro.trim()) {
      alert("Por favor, descreva os erros antes de enviar o feedback.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("defesa-civil.token");
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      const payload = {
        status: novoStatus,
        erros: novoStatus === "ERRO" ? textoErro : null
      };

      const res = await fetch(`${baseUrl}/tentativas/${selecionada.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Falha ao atualizar a tentativa.");
      }

      setTentativas(prev => prev.map(t => 
        t.id === selecionada.id ? { ...t, status: novoStatus, erros: payload.erros } : t
      ));
      
      setModoErro(false);
      alert(novoStatus === "FINALIZADO" ? "Tentativa aprovada com sucesso!" : "Feedback enviado com sucesso!");

    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao atualizar a tentativa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // ADAPTADOR INTELIGENTE PARA O RESUMO
  // ==========================================
  const respostasObj = parseRespostas(selecionada?.respostas);
  const isFide = selecionada?.formulario.titulo.toUpperCase().includes("FIDE");
  const isDmate = selecionada?.formulario.titulo.toUpperCase().includes("DMATE");

  const raizFide = respostasObj.identificacao ? respostasObj : (respostasObj.fide || {});
  const raizDmate = respostasObj.caracterizacao_emergencia ? respostasObj : (respostasObj.dmate || {});

  // Cálculos dinâmicos (Soma os campos se eles vierem planos, ou lê direto se vierem aninhados)
  const totalHumanos = raizFide.danosHumanos?.totalAfetados || 
    ['mortos', 'feridos', 'enfermos', 'desabrigados', 'desalojados', 'desaparecidos', 'outros']
    .reduce((acc, k) => acc + Number(raizFide[`humanos_${k}`] || 0), 0);
  
  const totalPrejPub = raizFide.prejuizosEconomicosPublicos?.valorTotal ||
    ['agua', 'lixo', 'saude', 'ensino', 'esgoto', 'energia', 'telecom', 'seguranca', 'transporte']
    .reduce((acc, k) => acc + Number(raizFide[`prej_pub_${k}`] || 0), 0);
  
  const totalPrejPriv = raizFide.prejuizosEconomicosPrivados?.valorTotal ||
    ['agricultura', 'pecuaria', 'industria', 'comercio', 'servicos']
    .reduce((acc, k) => acc + Number(raizFide[`prej_priv_${k}`] || 0), 0);

  const countHumDmate = raizDmate.medidas_acoes?.recursos_humanos?.itens 
    ? Object.keys(raizDmate.medidas_acoes.recursos_humanos.itens).length 
    : ['ajuda','saude_pub','medica','aval_danos','busca','outros_hum','comunicacao','reabilitacao','seguranca'].filter(k => raizDmate[`s4_hum_${k}_sn`] === 'sim').length;
  
  const countMatDmate = raizDmate.medidas_acoes?.recursos_materiais?.itens 
    ? Object.keys(raizDmate.medidas_acoes.recursos_materiais.itens).length 
    : ['agua','maquinas','transportes','limpeza','uso_pessoal','outros_mat'].filter(k => raizDmate[`s4_mat_${k}_sn`] === 'sim').length;

  const totalFinDmate = raizDmate.medidas_acoes?.recursos_financeiros?.valor_financeiro_empregado ||
    ['mun', 'extra_mun', 'doacoes', 'outras'].reduce((acc, k) => acc + Number(raizDmate[`s4_fin_${k}_val`] || 0), 0);

  if (cargo !== null && cargo !== "ADMIN") {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#003882]">Acesso restrito</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Respostas dos alunos</h1>
        <p className="mt-3 text-slate-600">Esta area e visivel apenas para o supervisor da plataforma.</p>
        <Link href="/" className="mt-6 inline-flex rounded-lg bg-[#003882] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#002456]">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#003882]">Supervisor</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Respostas dos alunos</h1>
          <p className="mt-1 text-base text-slate-500">Consulte as tentativas enviadas no FIDE e no DMATE.</p>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Buscar</span>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Aluno, email ou formulario" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Formulario</span>
          <select value={filtroFormulario} onChange={(e) => setFiltroFormulario(e.target.value as "TODOS" | "FIDE" | "DMATE")} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20">
            <option value="TODOS">Todos</option>
            <option value="FIDE">FIDE</option>
            <option value="DMATE">DMATE</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</span>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as "TODOS" | "INICIADO" | "FINALIZADO" | "ERRO")} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20">
            <option value="TODOS">Todos</option>
            <option value="FINALIZADO">Finalizado</option>
            <option value="INICIADO">Iniciado</option>
            <option value="ERRO">Erro</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Carregando respostas...</div>
      ) : erro ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{erro}</div>
      ) : tentativasFiltradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-slate-900">Nenhuma resposta encontrada</p>
          <p className="mt-1 text-sm text-slate-500">Ajuste os filtros ou aguarde novos envios.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm h-fit">
            <div className="border-b border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">{tentativasFiltradas.length} tentativa(s)</p>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-2">
              {tentativasFiltradas.map((tentativa) => {
                const selecionadaAtual = tentativa.id === selecionada?.id;
                return (
                  <button key={tentativa.id} type="button" onClick={() => setSelecionadaId(tentativa.id)} className={`mb-2 w-full rounded-xl border p-4 text-left transition ${selecionadaAtual ? "border-[#003882] bg-blue-50" : "border-transparent hover:border-slate-200 hover:bg-slate-50"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{tentativa.usuario.nome}</p>
                        <p className="text-sm text-slate-500">{tentativa.formulario.titulo}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${getBadgeClass(tentativa.status)}`}>{tentativa.status}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{valorTexto(tentativa.usuario.email)}</span><span>•</span><span>{formatarDataBR(tentativa.iniciado_em)}</span>
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
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#003882]">Detalhes da tentativa</p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">{selecionada.usuario.nome}</h2>
                    <p className="mt-1 text-sm text-slate-500">{selecionada.usuario.email}</p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-sm font-semibold ${getBadgeClass(selecionada.status)}`}>{selecionada.status}</span>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Formulario</p>
                    <p className="mt-2 font-semibold text-slate-900">{selecionada.formulario.titulo}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Inicio</p>
                    <p className="mt-2 font-semibold text-slate-900">{formatarDataBR(selecionada.iniciado_em)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Finalizacao</p>
                    <p className="mt-2 font-semibold text-slate-900">{formatarDataBR(selecionada.finalizado_em)}</p>
                  </div>
                </div>

                {isFide ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Resumo FIDE</h3>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Identificacao</p>
                        <p className="mt-2 font-medium text-slate-900">{valorTexto(raizFide.identificacao?.municipio || raizFide.municipio)}</p>
                        <p className="text-sm text-slate-500">
                          UF {valorTexto(raizFide.identificacao?.uf || raizFide.uf)} • IBGE {valorTexto(raizFide.identificacao?.codigoIbge || raizFide.codigo_ibge)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">COBRADE</p>
                        <p className="mt-2 font-medium text-slate-900">{valorTexto(raizFide.tipificacao?.cobrade || raizFide.cobrade)}</p>
                        <p className="text-sm text-slate-500">
                          {valorTexto(raizFide.dataOcorrencia?.dia || raizFide.dia)}/
                          {valorTexto(raizFide.dataOcorrencia?.mes || raizFide.mes)}/
                          {valorTexto(raizFide.dataOcorrencia?.ano || raizFide.ano)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Danos humanos</p>
                        <p className="mt-2 font-medium text-slate-900">Total {numeroOuTexto(totalHumanos)}</p>
                        <p className="text-sm text-slate-500">Desabrigados {numeroOuTexto(raizFide.danosHumanos?.desabrigados || raizFide.humanos_desabrigados)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Prejuizos publicos</p>
                        <p className="mt-2 font-medium text-slate-900">R$ {numeroOuTexto(totalPrejPub)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Prejuizos privados</p>
                        <p className="mt-2 font-medium text-slate-900">R$ {numeroOuTexto(totalPrejPriv)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Area afetada</p>
                        <p className="mt-2 font-medium text-slate-900 line-clamp-2">
                          {valorTexto(raizFide.areaPopulacaoAfetada?.descricao_areas_afetadas || raizFide.descricao_areas)}
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
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Emergencia</p>
                        <p className="mt-2 font-medium text-slate-900">Capacidade superada: {valorSimNao(raizDmate.caracterizacao_emergencia?.capacidade_superada ?? raizDmate.s1_cap_superada)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Historico</p>
                        <p className="mt-2 font-medium text-slate-900">Ocorreu antes: {valorSimNao(raizDmate.informacoes_desastre?.evento_ocorreu_anteriormente ?? raizDmate.s2_ocorreu_ant)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gestao</p>
                        <p className="mt-2 font-medium text-slate-900">Mapeamento: {valorSimNao(raizDmate.capacidade_gerencial?.mapeamento_areas ?? raizDmate.s3_mapeamento)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recursos humanos</p>
                        <p className="mt-2 font-medium text-slate-900">{numeroOuTexto(countHumDmate)} itens</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recursos materiais</p>
                        <p className="mt-2 font-medium text-slate-900">{numeroOuTexto(countMatDmate)} itens</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recursos financeiros</p>
                        <p className="mt-2 font-medium text-slate-900">R$ {numeroOuTexto(totalFinDmate)}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* --- ÁREA: VISUALIZADOR E PDF --- */}
                <div className="mt-6 border-t border-slate-200 pt-6">
                  <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700">Documentação Preenchida</h4>
                  <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </div>
                    <h5 className="mb-1 font-bold text-slate-800">Visualizador de Formulários</h5>
                    <p className="mb-6 max-w-sm text-sm text-slate-500">O aluno preencheu os dados do FIDE e DMATE. Clique abaixo para gerar o PDF ou visualizar os formulários preenchidos no padrão do S2iD.</p>
                    <a href={`/imprimir/${selecionada.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-[#4f88d1] px-6 py-2.5 font-bold text-white shadow-sm transition-all hover:bg-[#596f8f]">
                      Abrir Documento PDF
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    </a>
                  </div>
                </div>

                {/* --- ÁREA: AVALIAÇÃO DO SUPERVISOR --- */}
                <div className="mt-8 border-t border-slate-200 pt-6">
                  <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700">Avaliação do Supervisor</h4>
                  {selecionada.erros !== undefined && selecionada.erros !== null && !modoErro && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="mb-1 text-sm font-bold text-red-800">Feedback apontado anteriormente:</p>
                      <p className="whitespace-pre-wrap text-sm text-red-700">{typeof selecionada.erros === 'string' ? selecionada.erros : JSON.stringify(selecionada.erros, null, 2)}</p>
                    </div>
                  )}

                  {!modoErro ? (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button onClick={() => handleAvaliar("FINALIZADO")} disabled={isSubmitting} className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50">
                        {isSubmitting ? "Processando..." : "Aprovar (Tudo Certo)"}
                      </button>
                      <button onClick={() => setModoErro(true)} disabled={isSubmitting} className="flex-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 hover:border-red-300 disabled:opacity-50">
                        Apontar Erros
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 animate-in fade-in zoom-in-95">
                      <label className="block space-y-2">
                        <span className="text-sm font-bold text-slate-700">Descreva o que o aluno precisa corrigir:</span>
                        <textarea rows={4} value={textoErro} onChange={(e) => setTextoErro(e.target.value)} placeholder="Ex: Preenchimento incorreto na seção de Danos Materiais..." className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />
                      </label>
                      <div className="flex gap-3">
                        <button onClick={() => handleAvaliar("ERRO")} disabled={isSubmitting} className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50">
                          {isSubmitting ? "Enviando..." : "Enviar Feedback"}
                        </button>
                        <button onClick={() => setModoErro(false)} disabled={isSubmitting} className="rounded-lg bg-slate-200 px-5 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-300">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

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