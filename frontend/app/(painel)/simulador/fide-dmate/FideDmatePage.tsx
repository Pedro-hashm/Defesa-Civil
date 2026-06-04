"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Fide from "@/components/forms/Fide";
import Dmate from "@/components/forms/Dmate";
import {
  carregarCatalogoSimulado,
  montarRespostaDmate,
  montarRespostaFide,
  salvarTentativaFormulario,
  TentativaStatus,
  type CatalogoSimulado,
  type FlatFormData,
} from "@/lib/tentativas";

type Feedback = {
  texto: string;
  tipo: "sucesso" | "erro";
} | null;

export default function FideDmatePage() {
  const [fideData, setFideData] = useState<FlatFormData>({});
  const [fideErrors, setFideErrors] = useState<Record<string, string>>({});
  const [dmateData, setDmateData] = useState<FlatFormData>({});
  const [catalogo, setCatalogo] = useState<CatalogoSimulado | null>(null);
  const [isLoadingCatalogo, setIsLoadingCatalogo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensagem, setMensagem] = useState<Feedback>(null);

  useEffect(() => {
    async function carregar() {
      setIsLoadingCatalogo(true);
      try {
        const resposta = await carregarCatalogoSimulado();
        setCatalogo(resposta);
      } catch {
        setCatalogo(null);
      } finally {
        setIsLoadingCatalogo(false);
      }
    }

    void carregar();
  }, []);

  function validarFide(data: FlatFormData): Record<string, string> {
    const erros: Record<string, string> = {};

    if (!data.uf) erros.uf = "UF é obrigatória.";
    if (!String(data.municipio ?? "").trim()) erros.municipio = "Município é obrigatório.";

    const ibgeStr = String(data.codigo_ibge ?? "").trim();
    if (!ibgeStr) {
      erros.codigo_ibge = "Código IBGE é obrigatório.";
    } else if (!/^\d{6,7}$/.test(ibgeStr)) {
      erros.codigo_ibge = "Código IBGE deve ter 6 ou 7 dígitos numéricos.";
    }

    if (data.populacao === "" || data.populacao === undefined || data.populacao === null) {
      erros.populacao = "População é obrigatória.";
    } else if (Number(data.populacao) <= 0) {
      erros.populacao = "População deve ser maior que zero.";
    }

    const isMonetary = (v: unknown) => {
      const s = String(v ?? "").trim().replace(/^R\$\s*/, "").trim();
      return s !== "" && /^[\d.,]+$/.test(s) && /\d/.test(s);
    };

    if (!String(data.pib_anual ?? "").trim()) {
      erros.pib_anual = "PIB anual é obrigatório.";
    } else if (!isMonetary(data.pib_anual)) {
      erros.pib_anual = "PIB anual inválido. Use valor monetário (ex: 12.700,50).";
    }

    if (!String(data.orcamento_anual ?? "").trim()) {
      erros.orcamento_anual = "Orçamento anual é obrigatório.";
    } else if (!isMonetary(data.orcamento_anual)) {
      erros.orcamento_anual = "Orçamento anual inválido. Use valor monetário (ex: 12.700,50).";
    }

    if (!String(data.arrecadacao_anual ?? "").trim()) {
      erros.arrecadacao_anual = "Arrecadação anual é obrigatória.";
    } else if (!isMonetary(data.arrecadacao_anual)) {
      erros.arrecadacao_anual = "Arrecadação anual inválida. Use valor monetário (ex: 12.700,50).";
    }

    if (!data.cobrade) erros.cobrade = "COBRADE é obrigatório.";

    const diaStr = String(data.dia ?? "").trim();
    const mesStr = String(data.mes ?? "").trim();
    const anoStr = String(data.ano ?? "").trim();

    if (!diaStr) {
      erros.dia = "Dia é obrigatório.";
    } else {
      const dia = Number(diaStr);
      if (!Number.isInteger(dia) || dia < 1 || dia > 31) erros.dia = "Dia inválido (1–31).";
    }

    if (!mesStr) {
      erros.mes = "Mês é obrigatório.";
    } else {
      const mes = Number(mesStr);
      if (!Number.isInteger(mes) || mes < 1 || mes > 12) erros.mes = "Mês inválido (1–12).";
    }

    if (!anoStr) {
      erros.ano = "Ano é obrigatório.";
    } else {
      const ano = Number(anoStr);
      if (!Number.isInteger(ano) || ano < 1900 || ano > 2100) erros.ano = "Ano inválido.";
    }

    if (!erros.dia && !erros.mes && !erros.ano && diaStr && mesStr && anoStr) {
      const dia = Number(diaStr);
      const mes = Number(mesStr);
      const ano = Number(anoStr);
      const bissexto = (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
      const maxDias = [0, 31, bissexto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes];
      if (dia > maxDias) {
        const nomesMes = ["", "janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
        if (mes === 2) {
          erros.dia = bissexto
            ? `Fevereiro de ${ano} tem até 29 dias (ano bissexto).`
            : `Fevereiro de ${ano} tem até 28 dias.`;
        } else {
          const nome = nomesMes[mes];
          erros.dia = `${nome.charAt(0).toUpperCase() + nome.slice(1)} tem até ${maxDias} dias.`;
        }
      }
    }

    const horarioStr = String(data.horario ?? "").trim();
    if (!horarioStr) {
      erros.horario = "Horário é obrigatório.";
    } else if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(horarioStr)) {
      erros.horario = "Horário inválido (use HH:MM).";
    }

    return erros;
  }

  const clearFideError = (field: string) => {
    setFideErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  async function enviar(status: TentativaStatus) {
    if (!catalogo?.fide?.id || !catalogo?.dmate?.id) {
      setMensagem({
        tipo: "erro",
        texto: "Nao foi possivel identificar os formularios do simulado.",
      });
      return;
    }

    if (status === "FINALIZADO") {
      const erros = validarFide(fideData);
      if (Object.keys(erros).length > 0) {
        setFideErrors(erros);
        setMensagem({
          tipo: "erro",
          texto: "Corrija os campos obrigatórios do FIDE antes de finalizar o envio.",
        });
        return;
      }
    }

    setFideErrors({});
    setIsSubmitting(true);
    setMensagem(null);

    const resultados = await Promise.allSettled([
      salvarTentativaFormulario({
        formularioId: catalogo.fide.id,
        respostas: montarRespostaFide(fideData),
        status,
      }),
      salvarTentativaFormulario({
        formularioId: catalogo.dmate.id,
        respostas: montarRespostaDmate(dmateData),
        status,
      }),
    ]);

    const falhas = resultados
      .map((resultado, indice) => {
        if (resultado.status === "fulfilled") {
          return null;
        }

        return indice === 0 ? "FIDE" : "DMATE";
      })
      .filter((item): item is "FIDE" | "DMATE" => item !== null);

    if (falhas.length > 0) {
      setMensagem({
        tipo: "erro",
        texto:
          falhas.length === 2
            ? "Nao foi possivel salvar FIDE e DMATE."
            : `Nao foi possivel salvar o formulario ${falhas[0]}.`,
      });
    } else {
      setMensagem({
        tipo: "sucesso",
        texto:
          status === "FINALIZADO"
            ? "Respostas enviadas com sucesso."
            : "Rascunho salvo com sucesso.",
      });
    }

    setIsSubmitting(false);
  }

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <nav className="mb-2 flex text-sm text-slate-500">
            <Link
              href="/simulador"
              className="cursor-pointer transition-colors hover:text-pe-blue"
            >
              Simulador
            </Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-slate-900">FIDE e DMATE</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900">
            Preenchimento de Documentacao
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSubmitting || isLoadingCatalogo}
            onClick={() => void enviar("INICIADO")}
            className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Salvando..." : "Salvar rascunho"}
          </button>
          <button
            form="simulador-form"
            type="submit"
            disabled={isSubmitting || isLoadingCatalogo}
            className="cursor-pointer rounded-lg bg-pe-blue px-6 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-pe-blue-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Enviando..." : "Finalizar envio"}
          </button>
        </div>
      </div>

      {mensagem ? (
        <div
          className={`mb-6 rounded-xl border p-4 text-sm font-medium ${
            mensagem.tipo === "sucesso"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {mensagem.texto}
        </div>
      ) : null}

      {isLoadingCatalogo ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
          Carregando formularios...
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <form
            id="simulador-form"
            onSubmit={(e) => {
              e.preventDefault();
              void enviar("FINALIZADO");
            }}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:bg-white"
          >
            <div className="space-y-6 md:border-b md:border-slate-100 md:p-8">
              <div className="flex items-center justify-between border-b border-slate-100 p-4 md:pb-4">
                <h2 className="border-l-4 border-pe-yellow pl-4 text-xl font-bold text-slate-800">
                  1. Formulario de Informacoes do Desastre (FIDE)
                </h2>
                <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold uppercase text-slate-500">
                  Obrigatorio
                </span>
              </div>

              <p className="px-4 text-sm leading-relaxed text-slate-500 italic md:px-0">
                Preencha os dados do FIDE para registrar a tentativa do aluno.
              </p>

              <Fide fideData={fideData} setFideData={setFideData} errors={fideErrors} clearError={clearFideError} />
            </div>

            <div className="space-y-6 md:border-b md:border-slate-100 md:p-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="border-l-4 border-pe-red pl-4 text-xl font-bold text-slate-800">
                  2. Declaracao Municipal de Atuacao Emergencial (DMATE)
                </h2>
                <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold uppercase text-slate-500">
                  Obrigatorio
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-500 italic">
                Preencha os dados do DMATE e envie junto com o FIDE.
              </p>

              <Dmate dmateData={dmateData} setDmateData={setDmateData} />
            </div>
          </form>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-900">
                Progresso do simulado
              </h3>

              <div className="space-y-6">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase text-slate-400">
                    Secoes FIDE
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm font-medium text-green-600">
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Identificacao
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="h-4 w-4 rounded-full border-2 border-slate-200" />
                      Danos humanos
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase text-slate-400">
                    Secoes DMATE
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="h-4 w-4 rounded-full border-2 border-slate-200" />
                      Capacidade gerencial
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-800 shadow-sm">
              <h4 className="mb-2 flex items-center gap-2 font-bold">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Aviso
              </h4>
              <p className="leading-relaxed opacity-90">
                FIDE e DMATE serao salvos como tentativas separadas para o mesmo
                aluno.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
