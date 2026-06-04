"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Fide from "@/components/forms/Fide";
import Dmate from "@/components/forms/Dmate";

// ==========================================
// DESCOMPACTADOR PROFUNDO (Deep Parse)
// Garante que o JSON vire Objeto real, não importa como o Prisma tenha salvo
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepParseJSON(obj: any): any {
    if (typeof obj === 'string') {
        try {
            return deepParseJSON(JSON.parse(obj));
        } catch (e) {
            return obj; // Se não for JSON válido, retorna a string pura
        }
    } else if (obj !== null && typeof obj === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newObj: any = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
            newObj[key] = deepParseJSON(obj[key]);
        }
        return newObj;
    }
    return obj;
}

// Adaptador para casos de JSON antigos/profundos
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptarParaFidePlano(d: any) {
    if (!d || !d.identificacao) return d || {}; 
    
    const m = d.areaPopulacaoAfetada?.matriz_ocupacao || {};
    const matLinhas = d.danosMateriais?.linhas || [];
    const matMap: Record<string, string> = {
        'Unidades habitacionais': 'habitacionais',
        'Instalacoes publicas de saude': 'saude',
        'Instalacoes publicas de ensino': 'ensino',
        'Instalacoes publicas prestadoras de outros servicos': 'outros_servicos',
        'Instalacoes publicas de uso comunitario': 'comunitario',
        'Obras de infraestrutura publica': 'infraestrutura'
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flatMat: any = {};
    matLinhas.forEach((linha: any) => {
        const key = matMap[linha.discriminacao];
        if (key) {
            flatMat[`mat_${key}_dan`] = linha.quantidadeDanificadas || 0;
            flatMat[`mat_${key}_des`] = linha.quantidadeDestruidas || 0;
            flatMat[`mat_${key}_val`] = linha.valorReais || 0;
        }
    });

    return {
        uf: d.identificacao?.uf, municipio: d.identificacao?.municipio, codigo_ibge: d.identificacao?.codigoIbge, populacao: d.identificacao?.populacao, pib_anual: d.identificacao?.pibAnual, orcamento_anual: d.identificacao?.orcamentoAnual, arrecadacao_anual: d.identificacao?.arrecadacaoAnual,
        cobrade: d.tipificacao?.cobrade, dia: d.dataOcorrencia?.dia, mes: d.dataOcorrencia?.mes, ano: d.dataOcorrencia?.ano, horario: d.dataOcorrencia?.horario,
        causas_efeitos: d.causasEfeitos, descricao_areas: d.areaPopulacaoAfetada?.descricao_areas_afetadas,
        ocupacao_residencial: m.residencial, ocupacao_comercial: m.comercial, ocupacao_industrial: m.industrial, 'ocupacao_agrícola': m.agricola || m.agrícola, 'ocupacao_pecuária': m.pecuaria || m.pecuária, ocupacao_extrativismo_vegetal: m.extrativismo_vegetal, ocupacao_reserva_florestal_ou_apa: m.reserva_florestal_ou_apa, ocupacao_mineração: m.mineracao || m.mineração, 'ocupacao_turismo_e_outras': m.turismo_e_outras,
        humanos_mortos: d.danosHumanos?.mortos, humanos_feridos: d.danosHumanos?.feridos, humanos_enfermos: d.danosHumanos?.enfermos, humanos_desabrigados: d.danosHumanos?.desabrigados, humanos_desalojados: d.danosHumanos?.desalojados, humanos_desaparecidos: d.danosHumanos?.desaparecidos, humanos_outros: d.danosHumanos?.outrosAfetados, desc_humanos: d.danosHumanos?.descricao,
        ...flatMat, desc_materiais: d.danosMateriais?.descricao,
        amb_agua_sn: d.danosAmbientais?.poluicaoAgua ? 'sim' : 'nao', amb_ar_sn: d.danosAmbientais?.poluicaoAr ? 'sim' : 'nao', amb_solo_sn: d.danosAmbientais?.poluicaoSolo ? 'sim' : 'nao', amb_hidrico_sn: d.danosAmbientais?.exaurimentoHidrico ? 'sim' : 'nao', amb_incendio_sn: d.danosAmbientais?.incendiosApaApp ? 'sim' : 'nao', amb_agua_pop: d.danosAmbientais?.descricaoPopulacaoAtingida, amb_ar_pop: d.danosAmbientais?.descricaoPopulacaoAtingida, amb_solo_pop: d.danosAmbientais?.descricaoPopulacaoAtingida, amb_hidrico_pop: d.danosAmbientais?.descricaoPopulacaoAtingida, amb_incendio_area: d.danosAmbientais?.descricaoPopulacaoAtingida, desc_ambientais: d.danosAmbientais?.descricao,
        prej_pub_agua: d.prejuizosEconomicosPublicos?.porServico?.agua, prej_pub_lixo: d.prejuizosEconomicosPublicos?.porServico?.lixo, prej_pub_saude: d.prejuizosEconomicosPublicos?.porServico?.saude, prej_pub_ensino: d.prejuizosEconomicosPublicos?.porServico?.ensino, prej_pub_esgoto: d.prejuizosEconomicosPublicos?.porServico?.esgoto, prej_pub_energia: d.prejuizosEconomicosPublicos?.porServico?.energia, prej_pub_telecom: d.prejuizosEconomicosPublicos?.porServico?.telecom, prej_pub_seguranca: d.prejuizosEconomicosPublicos?.porServico?.seguranca, prej_pub_transporte: d.prejuizosEconomicosPublicos?.porServico?.transporte, desc_prej_pub: d.prejuizosEconomicosPublicos?.descricao,
        prej_priv_agricultura: d.prejuizosEconomicosPrivados?.agricultura, prej_priv_pecuaria: d.prejuizosEconomicosPrivados?.pecuaria, prej_priv_industria: d.prejuizosEconomicosPrivados?.industria, prej_priv_comercio: d.prejuizosEconomicosPrivados?.comercio, prej_priv_servicos: d.prejuizosEconomicosPrivados?.servicos, desc_prej_priv: d.prejuizosEconomicosPrivados?.descricao,
    };
}

function SimuladorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit"); // Lemos o ID da URL

    const [fideData, setFideData] = useState({});
    const [dmateData, setDmateData] = useState({});
    const [isLoading, setIsLoading] = useState(!!editId);
    const [isSaving, setIsSaving] = useState(false);

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
                
                // Aplicamos o descascador profundo
                const respostasSeguras = deepParseJSON(data.respostas || {});
                console.log("📥 Dados carregados no Simulador:", respostasSeguras);

                // Direciona para FIDE e DMATE corretamente
                const raizFide = respostasSeguras.identificacao ? respostasSeguras : (respostasSeguras.fide || {});
                const raizDmate = respostasSeguras.caracterizacao_emergencia ? respostasSeguras : (respostasSeguras.dmate || {});

                setFideData(adaptarParaFidePlano(raizFide));
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

    const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
        e.preventDefault();
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

            if (!res.ok) throw new Error("Erro ao salvar formulário");

            alert(isDraft ? "Rascunho salvo com sucesso!" : "Formulário enviado para avaliação com sucesso!");
            
            // Retorna o aluno para a listagem
            router.push("/minhas-respostas");

        } catch (error) {
            console.error(error);
            alert("Erro ao enviar dados para o servidor.");
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
                            <Fide fideData={fideData} setFideData={setFideData} />
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
