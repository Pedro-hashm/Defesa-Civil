"use client";

import { useState } from "react";
import Link from "next/link";
import Fide from "@/components/forms/Fide";
import Dmate from "@/components/forms/Dmate";
import { salvarSimulacaoFideDmate } from "@/services/simuladorService";

type SimulacaoFormData = Record<string, unknown>;

function hasAtLeastOneMappedArea(mapaGeojson: unknown): boolean {
    if (!mapaGeojson) {
        return false;
    }

    try {
        const parsed =
            typeof mapaGeojson === "string"
                ? (JSON.parse(mapaGeojson) as unknown)
                : mapaGeojson;

        if (
            typeof parsed !== "object" ||
            parsed === null ||
            !("features" in parsed)
        ) {
            return false;
        }

        const features = (parsed as { features?: unknown }).features;
        return Array.isArray(features) && features.length > 0;
    } catch {
        return false;
    }
}

export default function FideDmatePage() {
    // Estados que concentram toda a informação dos subformulários
    const [fideData, setFideData] = useState<SimulacaoFormData>({});
    const [dmateData, setDmateData] = useState<SimulacaoFormData>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setSubmitMessage(null);
        setSubmitError(null);

        if (!hasAtLeastOneMappedArea(fideData.mapa_geojson)) {
            setSubmitError("Selecione ao menos uma area atingida no mapa antes de finalizar.");
            return;
        }

        setIsSubmitting(true);

        try {
            await salvarSimulacaoFideDmate({
                fide: fideData,
                dmate: dmateData,
            });

            setSubmitMessage("Simulacao salva com sucesso no banco de dados.");
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Nao foi possivel salvar a simulacao.";
            setSubmitError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 pb-20">
            
            {/* Header de Navegação / Breadcrumb */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <nav className="flex mb-2 text-sm text-slate-500">
                        <Link href="/simulador" className="hover:text-pe-blue transition-colors cursor-pointer">Simulador</Link>
                        <span className="mx-2">/</span>
                        <span className="text-slate-900 font-medium">FIDE e DMATE</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-slate-900">Preenchimento de Documentação</h1>
                </div>

                {/* Botões de Ação vinculados ao Form via ID ou por estarem dentro dele */}
                <div className="flex items-center gap-3">
                    <button 
                        type="button" // Botão de rascunho não deve dar submit
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                    >
                        Salvar Rascunho
                    </button>
                    <button 
                        form="simulador-form" // Vincula ao form pelo ID caso queira mover o botão pra fora
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 text-sm font-bold !text-white bg-pe-blue hover:bg-pe-blue-dark rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                        {isSubmitting ? "Salvando..." : "Finalizar Envio"}
                    </button>
                </div>
            </div>

            {submitMessage && (
                <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {submitMessage}
                </div>
            )}

            {submitError && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {submitError}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                <div className="lg:col-span-3">
                    {/* FORM ÚNICO CONSOLIDADO */}
                    <form id="simulador-form" onSubmit={handleSubmit} className="md:bg-white rounded-xl md:border md:border-slate-200 shadow-sm overflow-hidden">
                        
                        {/* SEÇÃO 1: FIDE */}
                        <div className="md:p-8 space-y-6 md:border-b md:border-slate-100">

                            <div className="flex items-center justify-between border-b border-slate-100 md:pb-4 p-4">
                                <h2 className="text-xl font-bold text-slate-800 border-l-4 border-pe-yellow pl-4">
                                    1. Formulário de Informações do Desastre (FIDE)
                                </h2>
                                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase">Obrigatório</span>
                            </div>

                            <p className="text-slate-500 text-sm italic leading-relaxed px-4 md:px-0">
                                Detalhe os danos humanos, materiais, ambientais e prejuízos econômicos do cenário.
                            </p>
                        
                            {/* Componente FIDE recebendo estados do pai */}
                            <Fide fideData={fideData} setFideData={setFideData} />

                        </div>

                        {/* SEÇÃO 2: DMATE */}
                        <div className="p-8 space-y-6 bg-slate-50/30">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <h2 className="text-xl font-bold text-slate-800 border-l-4 border-pe-red pl-4">
                                    2. Declaração Municipal de Atuação Emergencial (DMATE)
                                </h2>
                                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase">Obrigatório</span>
                            </div>
                            <p className="text-slate-500 text-sm italic leading-relaxed">
                                Informe a capacidade de resposta e as ações já adotadas pelo município.
                            </p>
                        
                            {/* Componente DMATE recebendo estados do pai */}
                            <Dmate dmateData={dmateData} setDmateData={setDmateData} />
                        </div>

                    </form>
                </div>

                {/* Barra Lateral de Status */}
                <aside className="lg:col-span-1">
                    <div className="sticky top-8 space-y-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 text-xs uppercase tracking-wider">Progresso do Simulado</h3>
                            
                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Seções FIDE</p>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-2 text-sm text-green-600 font-medium">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                            Identificação
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-slate-400">
                                            <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
                                            Danos Humanos
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Seções DMATE</p>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-2 text-sm text-slate-400">
                                            <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
                                            Capacidade Gerencial
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-xl border border-blue-100 p-5 text-sm text-blue-800 shadow-sm">
                            <h4 className="font-bold mb-2 flex items-center gap-2 font-sans">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Lembrete S2iD
                            </h4>
                            <p className="leading-relaxed opacity-90">
                                Garanta que os dados de população afetada no FIDE batam com as necessidades de recursos do DMATE.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
