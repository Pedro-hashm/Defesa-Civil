"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SolicitacaoRecursos from "@/components/forms/Recursos";
import { deepParseJSON } from "@/lib/json";
import {
  obterIdFormularioRecursos,
  salvarTentativaFormulario,
} from "@/lib/tentativas";
import { API_URL } from "@/lib/api";

function SimuladorRecursosContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [recursosData, setRecursosData] = useState<any>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [formularioId, setFormularioId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(!!editId);
    const [isSaving, setIsSaving] = useState(false);
    const [erroSupervisor, setErroSupervisor] = useState<string | null>(null);

    useEffect(() => {
        obterIdFormularioRecursos()
            .then(setFormularioId)
            .catch((error) => {
                console.error("Falha ao carregar formulario de recursos:", error);
            });
    }, []);

    useEffect(() => {
        if (!editId) return;

        async function carregarTentativa() {
            try {
                const token = localStorage.getItem("defesa-civil.token");

                const res = await fetch(`${API_URL}/tentativas/${editId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) throw new Error("Erro ao buscar tentativa.");
                const data = await res.json();

                if (data.status === "ERRO" && data.erros) {
                    setErroSupervisor(
                        typeof data.erros === 'string' ? data.erros : JSON.stringify(data.erros)
                    );
                }

                const respostasSeguras = deepParseJSON(data.respostas || {});
                const dadosExtraidos = respostasSeguras.solicitacao_recursos
                    ? respostasSeguras.solicitacao_recursos
                    : respostasSeguras;

                setRecursosData(dadosExtraidos);
            } catch (error) {
                console.error("Falha no carregamento:", error);
                alert("Houve um erro ao carregar os dados do seu rascunho/correção.");
            } finally {
                setIsLoading(false);
            }
        }

        carregarTentativa();
    }, [editId]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function validarRecursos(data: any): Record<string, string> {
        const erros: Record<string, string> = {};

        if (!data.uf) erros.uf = "UF é obrigatória.";
        if (!data.cobrade) erros.cobrade = "O COBRADE (Desastre) é obrigatório.";
        if (!String(data.data_ocorrencia ?? "").trim()) {
            erros.data_ocorrencia = "Data da ocorrência é obrigatória.";
        }

        return erros;
    }

    const clearRecursoError = (field: string) => {
        setFormErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
        e.preventDefault();

        if (!isDraft) {
            const erros = validarRecursos(recursosData);
            if (Object.keys(erros).length > 0) {
                setFormErrors(erros);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
        }

        if (!formularioId) {
            alert("Não foi possível identificar o formulário de Solicitação de Recursos no sistema.");
            return;
        }

        setFormErrors({});
        setIsSaving(true);

        try {
            await salvarTentativaFormulario({
                formularioId,
                tentativaId: editId ? Number(editId) : undefined,
                status: "INICIADO",
                erros: null,
                respostas: {
                    solicitacao_recursos: recursosData,
                },
            });

            alert(isDraft ? "Rascunho salvo com sucesso!" : "Solicitação enviada para avaliação com sucesso!");
            router.push("/minhas-respostas");
        } catch (error) {
            console.warn(error);
            let msg = error instanceof Error ? error.message : "Erro ao enviar dados para o servidor.";
            if (msg.toLowerCase().includes("cargo insuficiente") || msg.toLowerCase().includes("acesso negado")) {
                msg = "Apenas alunos podem enviar formulários. Faça login com uma conta de aluno para continuar.";
            }
            alert(msg);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4 text-slate-500">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold tracking-wide">Carregando seus dados...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 pb-20">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <nav className="flex mb-2 text-sm text-slate-500">
                        <Link href="/minhas-respostas" className="hover:text-pe-blue transition-colors cursor-pointer">Minhas Respostas</Link>
                        <span className="mx-2">/</span>
                        <span className="text-slate-900 font-medium">{editId ? "Corrigir Formulário" : "Solicitação de Recursos"}</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-slate-900">{editId ? "Correção da Solicitação" : "Nova Solicitação de Recursos"}</h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, true)}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
                    >
                        {isSaving ? "Salvando..." : "Salvar Rascunho"}
                    </button>
                    <button
                        form="recursos-form"
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2 text-sm font-bold !text-white bg-pe-blue hover:bg-pe-blue-dark rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                        {isSaving ? "Enviando..." : (editId ? "Reenviar para Avaliação" : "Finalizar Envio")}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                    <form id="recursos-form" onSubmit={(e) => handleSubmit(e, false)} className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <SolicitacaoRecursos
                            data={recursosData}
                            setData={setRecursosData}
                            errors={formErrors}
                            clearError={clearRecursoError}
                        />
                    </form>
                </div>

                <aside className="lg:col-span-1">
                    <div className="sticky top-8 space-y-6">
                        {erroSupervisor && (
                            <div className="bg-red-50 rounded-xl border border-red-200 p-5 text-sm text-red-800 shadow-sm animate-in zoom-in-95 duration-300">
                                <h4 className="font-bold mb-3 flex items-center gap-2 text-red-900 uppercase tracking-wider text-xs">
                                    Ajustes Solicitados
                                </h4>
                                <p className="leading-relaxed opacity-95 whitespace-pre-wrap font-medium">
                                    {erroSupervisor}
                                </p>
                            </div>
                        )}

                        <div className="bg-blue-50 rounded-xl border border-blue-100 p-5 text-sm text-blue-800 shadow-sm">
                            <h4 className="font-bold mb-2 flex items-center gap-2 font-sans">
                                Dica de Preenchimento
                            </h4>
                            <p className="leading-relaxed opacity-90">
                                Lembre-se de verificar se a quantidade de itens solicitados (Kits, Cestas, Água) está coerente com o número de pessoas desabrigadas e desalojadas cadastradas no seu FIDE.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default function SolicitarRecursosPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center flex-col gap-4 text-slate-500">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold tracking-wide">Iniciando simulador...</p>
            </div>
        }>
            <SimuladorRecursosContent />
        </Suspense>
    );
}
