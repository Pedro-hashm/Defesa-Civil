"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Fide from "@/components/forms/Fide";
import Dmate from "@/components/forms/Dmate";
import Recursos from "@/components/forms/Recursos";
import { adaptarFideParaPlano } from "@/lib/fideAdapter";
import {
  detectarTipoFormulario,
  extrairRaizRecursos,
  rotuloTipoFormulario,
} from "@/lib/formularios";
import { parseRespostas } from "@/lib/json";
import { API_URL } from "@/lib/api";

export default function ImprimirDocumentoPage() {
    const params = useParams();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tentativa, setTentativa] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [erroAPI, setErroAPI] = useState<string | null>(null);

    useEffect(() => {
        async function carregarDados() {
            try {
                const token = localStorage.getItem("defesa-civil.token");
                const url = `${API_URL}/tentativas/${params.id}`;

                const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) throw new Error(`Erro HTTP ${res.status}: Não foi possível carregar.`);

                const data = await res.json();
                setTentativa(data);
            } catch (err) {
                setErroAPI(err instanceof Error ? err.message : "Erro desconhecido.");
            } finally {
                setLoading(false);
            }
        }
        if (params.id) carregarDados();
    }, [params.id]);

    if (loading) return <div className="flex h-screen items-center justify-center font-bold text-slate-500">Gerando documento...</div>;
    if (erroAPI || !tentativa || !tentativa.respostas) {
        return (
            <div className="flex flex-col h-screen items-center justify-center font-bold text-red-500 gap-2">
                <p>Erro ao carregar dados do documento.</p>
                <p className="text-sm font-normal text-slate-500">{erroAPI || "Nenhuma resposta encontrada na tentativa."}</p>
            </div>
        );
    }

    const respostasObj = parseRespostas(tentativa.respostas);
    const tipo = detectarTipoFormulario(tentativa.formulario?.titulo, respostasObj);
    const tituloDocumento = rotuloTipoFormulario(tipo);

    const raizFide = respostasObj.identificacao
        ? respostasObj
        : (respostasObj.fide as Record<string, unknown> | undefined) || {};
    const raizDmate = respostasObj.caracterizacao_emergencia
        ? respostasObj
        : (respostasObj.dmate as Record<string, unknown> | undefined) || {};

    const fideDataSeguro = adaptarFideParaPlano(raizFide);
    const dmateDataSeguro = raizDmate;
    const recursosDataSeguro = extrairRaizRecursos(respostasObj);

    const mostrarFide = tipo === "FIDE" || tipo === "FIDE_DMATE";
    const mostrarDmate = tipo === "DMATE" || tipo === "FIDE_DMATE";
    const mostrarRecursos = tipo === "RECURSOS";

    return (
        <div className="min-h-screen bg-white">
            <div className="print:hidden bg-slate-800 p-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
                <div className="text-white font-bold flex items-center gap-3">
                    <span className="bg-white/20 px-3 py-1 rounded-md text-sm">
                        Aluno: {tentativa.usuario?.nome || "Não identificado"}
                    </span>
                    <span className="bg-white/10 px-3 py-1 rounded-md text-sm">
                        {tituloDocumento}
                    </span>
                </div>
                <button onClick={() => window.print()} className="bg-pe-blue hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Salvar como PDF / Imprimir
                </button>
            </div>

            <div className="max-w-[1000px] mx-auto p-8 print:p-0 print:max-w-full">
                <div className="flex items-center gap-4 mb-8 border-b-2 border-slate-800 pb-4">
                    <Image src="/img/logo-defesa-civil1.jpg" alt="Defesa Civil" width={60} height={60} />
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wide">Sistema Nacional de Proteção e Defesa Civil - SINPDEC</h1>
                        <p className="text-sm text-slate-500">
                            {tituloDocumento} — {new Date(tentativa.finalizado_em || tentativa.iniciado_em || new Date()).toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                </div>

                <div className="pointer-events-none opacity-100">
                    {mostrarRecursos ? (
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-center text-[#00b0f0] mb-6 uppercase">Solicitação de Recursos</h2>
                            <Recursos data={recursosDataSeguro} setData={() => {}} />
                        </div>
                    ) : null}

                    {mostrarFide ? (
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-center text-[#00b0f0] mb-6 uppercase">Formulário de Informações do Desastre - FIDE</h2>
                            <Fide fideData={fideDataSeguro} setFideData={() => {}} />
                        </div>
                    ) : null}

                    {mostrarDmate ? (
                        <div className={`${mostrarFide ? "break-before-page mt-16 pt-16 border-t-2 border-dashed border-slate-300 print:border-none print:mt-0 print:pt-0" : "mb-8"}`}>
                            <h2 className="text-2xl font-bold text-center text-[#00b0f0] mb-6 uppercase">Declaração Municipal de Atuação Emergencial - DMATE</h2>
                            <Dmate dmateData={dmateDataSeguro} setDmateData={() => {}} />
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
