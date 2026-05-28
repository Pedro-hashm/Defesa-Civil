"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatarDataBR } from "@/lib/tentativas";

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

export default function MinhasRespostasPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tentativas, setTentativas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const token = localStorage.getItem("defesa-civil.token");
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        
        const res = await fetch(`${baseUrl}/tentativas`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Falha ao carregar suas tentativas.");
        
        const data = await res.json();
        setTentativas(data);
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Erro desconhecido.");
      } finally {
        setIsLoading(false);
      }
    }

    carregar();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#003882]">
            Área do Aluno
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Minhas Respostas
          </h1>
          <p className="mt-1 text-base text-slate-500">
            Acompanhe o status das suas simulações e corrija o que for necessário.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/simulador/fide-dmate"
            className="inline-flex items-center rounded-lg border border-[#003882] px-4 py-2.5 text-sm font-bold text-[#003882] transition hover:bg-[#003882]/5"
          >
            + Nova Simulação
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Carregando seu histórico...
        </div>
      ) : erro ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      ) : tentativas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-slate-900">
            Você ainda não enviou nenhum formulário
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Clique em "Nova Simulação" para começar seu treinamento.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tentativas.map((tentativa) => (
            <div key={tentativa.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-slate-300">
              
              {/* Header do Card */}
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 line-clamp-2" title={tentativa.formulario.titulo}>
                    {tentativa.formulario.titulo}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Enviado em: {formatarDataBR(tentativa.iniciado_em)}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getBadgeClass(tentativa.status)}`}>
                  {tentativa.status}
                </span>
              </div>

              {/* Corpo do Card (Exibe erros se houver) */}
              <div className="p-5 flex-1 flex flex-col bg-slate-50/30">
                {tentativa.status === "ERRO" && tentativa.erros && (
                  <div className="mb-4 flex-1 rounded-lg border border-red-200 bg-red-50 p-3 shadow-sm">
                    <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Ajustes Necessários
                    </p>
                    <p className="text-sm text-red-700 whitespace-pre-wrap">
                      {typeof tentativa.erros === 'string' ? tentativa.erros : JSON.stringify(tentativa.erros)}
                    </p>
                  </div>
                )}

                {tentativa.status === "FINALIZADO" && (
                  <div className="mb-4 flex-1 rounded-lg border border-emerald-200 bg-emerald-50 p-3 shadow-sm flex items-center gap-2">
                     <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm font-medium text-emerald-800">
                      Parabéns! Simulação aprovada pelo supervisor.
                    </p>
                  </div>
                )}

                {tentativa.status === "INICIADO" && (
                  <div className="mb-4 flex-1 rounded-lg border border-amber-200 bg-amber-50 p-3 shadow-sm flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm font-medium text-amber-800">
                      Aguardando correção do supervisor ou salvo como rascunho.
                    </p>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="mt-auto pt-4 flex gap-2">
                  {tentativa.status === "FINALIZADO" ? (
                    <a 
                      href={`/imprimir/${tentativa.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#4f88d1] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#596f8f]"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      Baixar PDF Aprovado
                    </a>
                  ) : (
                    <Link 
                      href={`/simulador/fide-dmate?edit=${tentativa.id}`}
                      className={`w-full flex items-center justify-center gap-2 text-center rounded-lg px-4 py-2.5 text-sm font-bold shadow-sm transition-all border ${
                        tentativa.status === "ERRO" 
                          ? "bg-red-600 text-white hover:bg-red-700 border-red-600" 
                          : "bg-white text-[#003882] border-[#003882] hover:bg-[#003882]/5"
                      }`}
                    >
                      {tentativa.status === "ERRO" ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          Corrigir Erros
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Continuar Edição
                        </>
                      )}
                    </Link>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}