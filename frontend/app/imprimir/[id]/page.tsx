"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Fide from "@/components/forms/Fide";
import Dmate from "@/components/forms/Dmate";

// ==========================================
// FUNÇÃO ADAPTADORA (Nested JSON -> Flat State)
// Converte o JSON complexo do Banco de Dados para o formato do Fide.tsx
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptarFideParaPlano(d: any) {
    if (!d || !d.identificacao) return d || {}; // Se já for plano ou vazio, retorna como está

    const m = d.areaPopulacaoAfetada?.matriz_ocupacao || {};
    const matLinhas = d.danosMateriais?.linhas || [];
    
    // Mapeador de Discriminacao de Danos Materiais
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
        uf: d.identificacao?.uf,
        municipio: d.identificacao?.municipio,
        codigo_ibge: d.identificacao?.codigoIbge,
        populacao: d.identificacao?.populacao,
        pib_anual: d.identificacao?.pibAnual,
        orcamento_anual: d.identificacao?.orcamentoAnual,
        arrecadacao_anual: d.identificacao?.arrecadacaoAnual,
        
        cobrade: d.tipificacao?.cobrade,
        dia: d.dataOcorrencia?.dia,
        mes: d.dataOcorrencia?.mes,
        ano: d.dataOcorrencia?.ano,
        horario: d.dataOcorrencia?.horario,
        
        causas_efeitos: d.causasEfeitos,
        
        descricao_areas: d.areaPopulacaoAfetada?.descricao_areas_afetadas,
        ocupacao_residencial: m.residencial,
        ocupacao_comercial: m.comercial,
        ocupacao_industrial: m.industrial,
        'ocupacao_agrícola': m.agricola || m.agrícola,
        'ocupacao_pecuária': m.pecuaria || m.pecuária,
        ocupacao_extrativismo_vegetal: m.extrativismo_vegetal,
        ocupacao_reserva_florestal_ou_apa: m.reserva_florestal_ou_apa,
        ocupacao_mineração: m.mineracao || m.mineração,
        'ocupacao_turismo_e_outras': m.turismo_e_outras,

        humanos_mortos: d.danosHumanos?.mortos,
        humanos_feridos: d.danosHumanos?.feridos,
        humanos_enfermos: d.danosHumanos?.enfermos,
        humanos_desabrigados: d.danosHumanos?.desabrigados,
        humanos_desalojados: d.danosHumanos?.desalojados,
        humanos_desaparecidos: d.danosHumanos?.desaparecidos,
        humanos_outros: d.danosHumanos?.outrosAfetados,
        desc_humanos: d.danosHumanos?.descricao,

        ...flatMat,
        desc_materiais: d.danosMateriais?.descricao,

        amb_agua_sn: d.danosAmbientais?.poluicaoAgua ? 'sim' : 'nao',
        amb_ar_sn: d.danosAmbientais?.poluicaoAr ? 'sim' : 'nao',
        amb_solo_sn: d.danosAmbientais?.poluicaoSolo ? 'sim' : 'nao',
        amb_hidrico_sn: d.danosAmbientais?.exaurimentoHidrico ? 'sim' : 'nao',
        amb_incendio_sn: d.danosAmbientais?.incendiosApaApp ? 'sim' : 'nao',
        amb_agua_pop: d.danosAmbientais?.descricaoPopulacaoAtingida,
        amb_ar_pop: d.danosAmbientais?.descricaoPopulacaoAtingida,
        amb_solo_pop: d.danosAmbientais?.descricaoPopulacaoAtingida,
        amb_hidrico_pop: d.danosAmbientais?.descricaoPopulacaoAtingida,
        amb_incendio_area: d.danosAmbientais?.descricaoPopulacaoAtingida,
        desc_ambientais: d.danosAmbientais?.descricao,

        prej_pub_agua: d.prejuizosEconomicosPublicos?.porServico?.agua,
        prej_pub_lixo: d.prejuizosEconomicosPublicos?.porServico?.lixo,
        prej_pub_saude: d.prejuizosEconomicosPublicos?.porServico?.saude,
        prej_pub_ensino: d.prejuizosEconomicosPublicos?.porServico?.ensino,
        prej_pub_esgoto: d.prejuizosEconomicosPublicos?.porServico?.esgoto,
        prej_pub_energia: d.prejuizosEconomicosPublicos?.porServico?.energia,
        prej_pub_telecom: d.prejuizosEconomicosPublicos?.porServico?.telecom,
        prej_pub_seguranca: d.prejuizosEconomicosPublicos?.porServico?.seguranca,
        prej_pub_transporte: d.prejuizosEconomicosPublicos?.porServico?.transporte,
        desc_prej_pub: d.prejuizosEconomicosPublicos?.descricao,

        prej_priv_agricultura: d.prejuizosEconomicosPrivados?.agricultura,
        prej_priv_pecuaria: d.prejuizosEconomicosPrivados?.pecuaria,
        prej_priv_industria: d.prejuizosEconomicosPrivados?.industria,
        prej_priv_comercio: d.prejuizosEconomicosPrivados?.comercio,
        prej_priv_servicos: d.prejuizosEconomicosPrivados?.servicos,
        desc_prej_priv: d.prejuizosEconomicosPrivados?.descricao,
    };
}

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
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                const url = `${baseUrl}/tentativas/${params.id}`; 
                
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

    // Processamento Seguro do JSON
    let respostasObj = tentativa.respostas;
    if (typeof respostasObj === "string") {
        try { respostasObj = JSON.parse(respostasObj); } catch (e) { respostasObj = {}; }
    }

    // Se o backend jogou os dados soltos na raiz (Ex: JSON da sua mensagem) 
    // ou se agrupou corretamente em "fide": { ... }
    const raizFide = respostasObj.identificacao ? respostasObj : (respostasObj.fide || {});
    const raizDmate = respostasObj.caracterizacao_emergencia ? respostasObj : (respostasObj.dmate || {});

    // Passamos pela função adaptadora para achatar
    const fideDataSeguro = adaptarFideParaPlano(raizFide);
    const dmateDataSeguro = raizDmate; // O DMATE costuma ser mais simples, passamos direto.

    return (
        <div className="min-h-screen bg-white">
            
            <div className="print:hidden bg-slate-800 p-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
                <div className="text-white font-bold flex items-center gap-3">
                    <span className="bg-white/20 px-3 py-1 rounded-md text-sm">
                        Aluno: {tentativa.usuario?.nome || "Não identificado"}
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
                    <Image src="/img/logo-defesa-civil.jpg" alt="Defesa Civil" width={60} height={60} />
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wide">Sistema Nacional de Proteção e Defesa Civil - SINPDEC</h1>
                        <p className="text-sm text-slate-500">Documento Oficial de Simulação - {new Date(tentativa.finalizado_em || tentativa.iniciado_em || new Date()).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>

                <div className="pointer-events-none opacity-100">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-center text-[#00b0f0] mb-6 uppercase">Formulário de Informações do Desastre - FIDE</h2>
                        <Fide fideData={fideDataSeguro} setFideData={() => {}} />
                    </div>

                    <div className="break-before-page mt-16 pt-16 border-t-2 border-dashed border-slate-300 print:border-none print:mt-0 print:pt-0">
                        <h2 className="text-2xl font-bold text-center text-[#00b0f0] mb-6 uppercase">Declaração Municipal de Atuação Emergencial - DMATE</h2>
                        <Dmate dmateData={dmateDataSeguro} setDmateData={() => {}} />
                    </div>
                </div>

            </div>
        </div>
    );
}