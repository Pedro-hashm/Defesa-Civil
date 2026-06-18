"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Fide from "@/components/forms/Fide";
import Dmate from "@/components/forms/Dmate";
import { adaptarFideParaPlano } from "@/lib/fideAdapter";
import { deepParseJSON } from "@/lib/json";

function SimuladorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit"); // Lemos o ID da URL

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [fideData, setFideData] = useState<any>({});
    const [fideErrors, setFideErrors] = useState<Record<string, string>>({});
    const [dmateData, setDmateData] = useState({});
    const [isLoading, setIsLoading] = useState(!!editId);
    const [isSaving, setIsSaving] = useState(false);
    
    // 👇 Novo estado para armazenar o erro retornado pelo supervisor
    const [erroSupervisor, setErroSupervisor] = useState<string | null>(null);

    // Efeito para carregar os dados se estivermos no modo "Correção"
    useEffect(() => {
        if (!editId) return;

        async function carregarTentativa() {
            try {
                const token = localStorage.getItem("defesa-civil.token");
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                
                const res = await fetch(`${baseUrl}/tentativas/${editId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) throw new Error("Erro ao buscar tentativa.");
                const data = await res.json();
                
                // 👇 Captura o erro da tentativa, se houver
                if (data.status === "ERRO" && data.erros) {
                    setErroSupervisor(
                        typeof data.erros === 'string' ? data.erros : JSON.stringify(data.erros)
                    );
                }
                
                // Aplicamos o descascador profundo
                const respostasSeguras = deepParseJSON(data.respostas || {});
                console.log("📥 Dados carregados no Simulador:", respostasSeguras);

                // Direciona para FIDE e DMATE corretamente
                const raizFide = respostasSeguras.identificacao ? respostasSeguras : (respostasSeguras.fide || {});
                const raizDmate = respostasSeguras.caracterizacao_emergencia ? respostasSeguras : (respostasSeguras.dmate || {});

                setFideData(adaptarFideParaPlano(raizFide));
                setDmateData(raizDmate);
                
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
    function validarFide(data: any): Record<string, string> {
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

    const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
        e.preventDefault();

        if (!isDraft) {
            const erros = validarFide(fideData);
            if (Object.keys(erros).length > 0) {
                setFideErrors(erros);
                return;
            }
        }

        setFideErrors({});
        setIsSaving(true);
        
        // Sempre forçamos status "INICIADO" para avaliações futuras e zeramos erros anteriores
        const payload = {
            formulario_id: 1, // Mude se FIDE/DMATE tiver outro ID no banco
            status: "INICIADO",
            erros: null, 
            respostas: {
                fide: fideData,
                dmate: dmateData
            }
        };

        try {
            const token = localStorage.getItem("defesa-civil.token");
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            
            // Se tem editId = ATUALIZA (PUT). Se não tem = CRIA (POST)
            const method = editId ? "PUT" : "POST";
            const url = editId ? `${baseUrl}/tentativas/${editId}` : `${baseUrl}/tentativas`;

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                let msg = `Erro ao salvar formulário (status ${res.status})`;
                try {
                    const errBody = await res.json() as { message?: string; error?: string };
                    if (errBody.message ?? errBody.error) msg = errBody.message ?? errBody.error ?? msg;
                } catch { /* ignore */ }
                throw new Error(msg);
            }

            alert(isDraft ? "Rascunho salvo com sucesso!" : "Formulário enviado para avaliação com sucesso!");
            
            // Retorna o aluno para a listagem
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
            
            {/* Header de Navegação */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <nav className="flex mb-2 text-sm text-slate-500">
                        <Link href="/minhas-respostas" className="hover:text-pe-blue transition-colors cursor-pointer">Minhas Respostas</Link>
                        <span className="mx-2">/</span>
                        <span className="text-slate-900 font-medium">{editId ? "Corrigir Formulário" : "FIDE e DMATE"}</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-slate-900">{editId ? "Correção de Documentação" : "Preenchimento de Documentação"}</h1>
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
                        form="simulador-form" 
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
                    <form id="simulador-form" onSubmit={(e) => handleSubmit(e, false)} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        
                        {/* SEÇÃO 1: FIDE */}
                        <div className="p-8 space-y-6 border-b border-slate-100">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <h2 className="text-xl font-bold text-slate-800 border-l-4 border-pe-yellow pl-4">
                                    1. Formulário de Informações do Desastre (FIDE)
                                </h2>
                            </div>
                            <Fide fideData={fideData} setFideData={setFideData} errors={fideErrors} clearError={clearFideError} />
                        </div>

                        {/* SEÇÃO 2: DMATE */}
                        <div className="p-8 space-y-6 bg-slate-50/30">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <h2 className="text-xl font-bold text-slate-800 border-l-4 border-pe-red pl-4">
                                    2. Declaração Municipal de Atuação Emergencial (DMATE)
                                </h2>
                            </div>
                            <Dmate dmateData={dmateData} setDmateData={setDmateData} />
                        </div>

                    </form>
                </div>

                {/* Barra Lateral */}
                <aside className="lg:col-span-1">
                    <div className="sticky top-8 space-y-6">
                        
                        {/* 👇 AVISO DE CORREÇÃO (Aparece apenas se houver erro retornado pela API) */}
                        {erroSupervisor && (
                            <div className="bg-red-50 rounded-xl border border-red-200 p-5 text-sm text-red-800 shadow-sm animate-in zoom-in-95 duration-300">
                                <h4 className="font-bold mb-3 flex items-center gap-2 text-red-900 uppercase tracking-wider text-xs">
                                    <svg className="w-5 h-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Ajustes Solicitados
                                </h4>
                                <p className="leading-relaxed opacity-95 whitespace-pre-wrap font-medium">
                                    {erroSupervisor}
                                </p>
                            </div>
                        )}
                        {/* ============================================================== */}

                        <div className="bg-blue-50 rounded-xl border border-blue-100 p-5 text-sm text-blue-800 shadow-sm">
                            <h4 className="font-bold mb-2 flex items-center gap-2 font-sans">
                                Lembrete S2iD
                            </h4>
                            <p className="leading-relaxed opacity-90">
                                Ao enviar a correção, o seu status voltará para "INICIADO" para que o supervisor possa avaliar sua nova resposta.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

// Suspense necessário no Next.js para leitura de searchParams da URL
export default function FideDmatePage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center flex-col gap-4 text-slate-500">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold tracking-wide">Iniciando simulador...</p>
            </div>
        }>
            <SimuladorContent />
        </Suspense>
    );
}