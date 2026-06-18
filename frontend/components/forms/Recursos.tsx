"use client";

import { useMemo } from "react";
import Image from "next/image";

// ==========================================
// LISTA COMPLETA COBRADE (Reaproveitada)
// ==========================================
const LISTA_COBRADE = [
    { id: "1.1.1.1.0", nome: "Tremor de terra" },
    { id: "1.1.1.2.0", nome: "Tsunami" },
    { id: "1.1.2.0.0", nome: "Emanação vulcânica" },
    { id: "1.1.3.1.1", nome: "Quedas, tombamentos e rolamentos - Blocos" },
    { id: "1.1.3.1.2", nome: "Quedas, tombamentos e rolamentos - Lascas" },
    { id: "1.1.3.1.3", nome: "Quedas, tombamentos e rolamentos - Matacães" },
    { id: "1.1.3.1.4", nome: "Quedas, tombamentos e rolamentos - Lajes" },
    { id: "1.1.3.2.1", nome: "Deslizamentos de solo e/ou rocha" },
    { id: "1.1.3.3.1", nome: "Corridas de massa - Solo/Lama" },
    { id: "1.1.3.3.2", nome: "Corridas de massa - Rocha/Detrito" },
    { id: "1.1.3.4.0", nome: "Subsidências e colapsos" },
    { id: "1.1.4.1.0", nome: "Erosão costeira/Marinha" },
    { id: "1.1.4.2.0", nome: "Erosão de margem fluvial" },
    { id: "1.1.4.3.1", nome: "Erosão continental - Laminar" },
    { id: "1.1.4.3.2", nome: "Erosão continental - Ravinas" },
    { id: "1.1.4.3.3", nome: "Erosão continental - Boçorocas" },
    { id: "1.2.1.0.0", nome: "Inundações" },
    { id: "1.2.2.0.0", nome: "Enxurradas" },
    { id: "1.2.3.0.0", nome: "Alagamentos" },
    { id: "1.3.1.1.1", nome: "Ciclones - Ventos costeiros (mobilidade de dunas)" },
    { id: "1.3.1.1.2", nome: "Ciclones - Marés de tempestade (ressaca)" },
    { id: "1.3.1.2.0", nome: "Frentes / Zonas de convergência" },
    { id: "1.3.2.1.1", nome: "Tempestade local/Convectiva - Tornados" },
    { id: "1.3.2.1.2", nome: "Tempestade local/Convectiva - Tempestade de raios" },
    { id: "1.3.2.1.3", nome: "Tempestade local/Convectiva - Granizo" },
    { id: "1.3.2.1.4", nome: "Tempestade local/Convectiva - Chuvas intensas" },
    { id: "1.3.2.1.5", nome: "Tempestade local/Convectiva - Vendaval" },
    { id: "1.3.3.1.0", nome: "Onda de calor" },
    { id: "1.3.3.2.1", nome: "Onda de frio - Friagem" },
    { id: "1.3.3.2.2", nome: "Onda de frio - Geadas" },
    { id: "1.4.1.1.0", nome: "Estiagem" },
    { id: "1.4.1.2.0", nome: "Seca" },
    { id: "1.4.1.3.1", nome: "Incêndios em áreas protegidas" },
    { id: "1.4.1.3.2", nome: "Incêndios em áreas não protegidas" },
    { id: "1.4.1.4.0", nome: "Baixa umidade do ar" },
    { id: "1.5.1.1.0", nome: "Doenças infecciosas virais" },
    { id: "1.5.1.2.0", nome: "Doenças infecciosas bacterianas" },
    { id: "1.5.1.3.0", nome: "Doenças infecciosas parasíticas" },
    { id: "1.5.1.4.0", nome: "Doenças infecciosas fúngicas" },
    { id: "1.5.2.1.0", nome: "Infestações de animais" },
    { id: "1.5.2.2.1", nome: "Infestações de algas - Marés vermelhas" },
    { id: "1.5.2.2.2", nome: "Infestações de algas - Cianobactérias" },
    { id: "1.5.2.3.0", nome: "Outras infestações" },
    { id: "2.1.1.1.0", nome: "Queda de satélite (radionuclídeos)" },
    { id: "2.1.2.1.0", nome: "Fontes radioativas em processos de produção" },
    { id: "2.1.3.1.0", nome: "Outras fontes de liberação de radionuclídeos" },
    { id: "2.2.1.1.0", nome: "Liberação de produtos químicos para a atmosfera" },
    { id: "2.2.2.1.0", nome: "Liberação de produtos químicos nos sistemas de água potável" },
    { id: "2.2.2.2.0", nome: "Derramamento de produtos químicos em ambiente lacustre, fluvial ou marinho" },
    { id: "2.2.3.1.0", nome: "Liberação de produtos químicos em consequência de ações militares" },
    { id: "2.2.4.1.0", nome: "Transporte de produtos perigosos - Rodoviário" },
    { id: "2.2.4.2.0", nome: "Transporte de produtos perigosos - Ferroviário" },
    { id: "2.2.4.3.0", nome: "Transporte de produtos perigosos - Aéreo" },
    { id: "2.2.4.4.0", nome: "Transporte de produtos perigosos - Dutoviário" },
    { id: "2.2.4.5.0", nome: "Transporte de produtos perigosos - Marítimo" },
    { id: "2.2.4.6.0", nome: "Transporte de produtos perigosos - Aquaviário" },
    { id: "2.3.1.1.0", nome: "Incêndios em plantas e distritos industriais, parques e depósitos" },
    { id: "2.3.1.2.0", nome: "Incêndios em aglomerados residenciais" },
    { id: "2.4.1.0.0", nome: "Colapso de edificações" },
    { id: "2.4.2.0.0", nome: "Rompimento/colapso de barragens" },
    { id: "2.5.1.0.0", nome: "Transporte de passageiros/cargas não perigosas - Rodoviário" },
    { id: "2.5.2.0.0", nome: "Transporte de passageiros/cargas não perigosas - Ferroviário" },
    { id: "2.5.3.0.0", nome: "Transporte de passageiros/cargas não perigosas - Aéreo" },
    { id: "2.5.4.0.0", nome: "Transporte de passageiros/cargas não perigosas - Marítimo" },
    { id: "2.5.5.0.0", nome: "Transporte de passageiros/cargas não perigosas - Aquaviário" },
];

export interface ItemRecurso {
    id: string;
    descricao: string;
    quantidade: number | "";
    unidade: string;
    periodo: number | "";
    valor_unitario: number | "";
}

interface RecursosProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setData: (data: any) => void;
    errors?: Record<string, string>;
    clearError?: (field: string) => void;
}

export default function Recursos({ data = {}, setData, errors = {}, clearError }: RecursosProps) {
    
    // Assegura que itens seja sempre um array (padrão 1 item vazio)
    const itensMeta: ItemRecurso[] = data.itens_meta || [
        { id: "1", descricao: "", quantidade: "", unidade: "UNIDADES", periodo: "", valor_unitario: "" }
    ];

    // Função auxiliar genérica
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (field: string, value: any) => {
        setData((prev: any) => ({ ...prev, [field]: value }));
        clearError?.(field);
    };

    // Funções para manipulação dos Itens da Meta
    const handleItemChange = (id: string, field: keyof ItemRecurso, value: string | number) => {
        const novosItens = itensMeta.map(item => 
            item.id === id ? { ...item, [field]: value } : item
        );
        handleChange("itens_meta", novosItens);
    };

    const adicionarItem = () => {
        const novoItem: ItemRecurso = {
            id: Math.random().toString(36).substr(2, 9),
            descricao: "",
            quantidade: "",
            unidade: "UNIDADES",
            periodo: data.meta_periodo || "",
            valor_unitario: ""
        };
        handleChange("itens_meta", [...itensMeta, novoItem]);
    };

    const removerItem = (id: string) => {
        if (itensMeta.length === 1) return; // Mantém pelo menos 1
        handleChange("itens_meta", itensMeta.filter(item => item.id !== id));
    };

    // ==========================================
    // CÁLCULOS AUTOMÁTICOS
    // ==========================================
    const valorTotalGeral = useMemo(() => {
        return itensMeta.reduce((acc, item) => {
            const qtde = Number(item.quantidade) || 0;
            const valorUn = Number(item.valor_unitario) || 0;
            return acc + (qtde * valorUn);
        }, 0);
    }, [itensMeta]);

    const formatarMoeda = (valor: number) => {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Estilos padrão do SINPDEC
    const sectionHeader = "bg-slate-500 text-white font-bold p-3 text-sm md:text-base uppercase rounded-t-md mt-8";
    const inputClass = "w-full border border-slate-300 p-2 md:p-2.5 text-sm md:text-base focus:border-pe-blue focus:ring-1 focus:ring-pe-blue outline-none bg-white";
    const thClass = "border border-slate-300 bg-slate-200 p-3 text-xs md:text-sm font-bold text-slate-700 text-center";
    const tdClass = "border border-slate-300 p-0 text-sm md:text-base bg-white";

    const getInputClass = (field: string) =>
        `${inputClass}${errors[field] ? " !border-red-500 focus:!border-red-500 focus:!ring-red-500" : ""}`;

    const FieldError = ({ field }: { field: string }) =>
        errors[field] ? <p className="mt-1 text-xs text-red-600 px-2">{errors[field]}</p> : null;

    return (
        <div className="space-y-8">

            {/* Cabeçalho Visual (Mimetizando o PDF oficial) */}
            <div className="bg-slate-600 rounded-t-xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm border-b-4 border-pe-yellow">
                <div className="bg-white p-2 rounded-lg shrink-0">
                    <Image
                        src="/img/logo-defesa-civil1.jpg"
                        alt="Defesa Civil"
                        width={96}
                        height={96}
                        className="h-24 w-24 rounded object-contain"
                    />
                </div>
                <div className="flex-1 text-white text-center md:text-left">
                    <h2 className="text-3xl font-bold uppercase tracking-wide">Formulário de Solicitação de Recursos Federais</h2>
                    <p className="opacity-80 mt-1">Sistema Nacional de Proteção e Defesa Civil - SINPDEC</p>
                </div>
            </div>

            {/* ==========================================
                1. IDENTIFICAÇÃO BÁSICA
            ========================================== */}
            <div className="border border-slate-300 bg-slate-50 p-5 rounded-b-xl shadow-sm -mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">UF</label>
                        <select className={getInputClass('uf')} value={data.uf || ""} onChange={(e) => handleChange('uf', e.target.value)}>
                            <option value="">Selecione...</option>
                            <option value="PE">PE</option>
                        </select>
                        <FieldError field="uf" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Desastre</label>
                        <select className={getInputClass('cobrade')} value={data.cobrade || ""} onChange={(e) => handleChange('cobrade', e.target.value)}>
                            <option value="">Selecione o tipo de COBRADE</option>
                            {LISTA_COBRADE.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.id} - {item.nome}
                                </option>
                            ))}
                        </select>
                        <FieldError field="cobrade" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data da Ocorrência</label>
                        <input type="date" className={getInputClass('data_ocorrencia')} value={data.data_ocorrencia || ""} onChange={(e) => handleChange('data_ocorrencia', e.target.value)} />
                        <FieldError field="data_ocorrencia" />
                    </div>
                </div>
            </div>

            {/* ==========================================
                TIPO DE SOLICITAÇÃO
            ========================================== */}
            <div>
                <h3 className={sectionHeader}>TIPO DE SOLICITAÇÃO</h3>
                <div className="border border-slate-300 border-t-0 p-0">
                    <select className="w-full p-3 text-slate-800 outline-none focus:ring-2 focus:ring-pe-blue/20 bg-white" value={data.tipo_solicitacao || ""} onChange={(e) => handleChange('tipo_solicitacao', e.target.value)}>
                        <option value="">Selecione o tipo de solicitação...</option>
                        <option value="Recursos para Ações de Assistência">Recursos para Ações de Assistência</option>
                        <option value="Restabelecimento de Serviços Essenciais">Restabelecimento de Serviços Essenciais</option>
                        <option value="Reconstrução">Reconstrução</option>
                    </select>
                </div>
            </div>

            {/* ==========================================
                ATUALIZAÇÃO DE DADOS HUMANOS
            ========================================== */}
            <div>
                <h3 className={sectionHeader}>ATUALIZAÇÃO DE DADOS HUMANOS (PESSOAS)</h3>
                <div className="border border-slate-300 border-t-0 overflow-x-auto">
                    <table className="w-full border-collapse min-w-[700px]">
                        <thead>
                            <tr>
                                <th className={thClass + " w-1/3"}>Desabrigados nº</th>
                                <th className={thClass + " w-1/3"}>Desalojados nº</th>
                                <th className={thClass + " w-1/3"}>Afetados nº</th>
                            </tr>
                            <tr className="bg-slate-50 text-slate-600 text-xs text-center align-top">
                                <td className="border border-slate-300 p-4">
                                    Pessoas que necessitam de abrigo público, como habitação temporária, em função de danos ou ameaça de danos diretamente causados pelo desastre.
                                </td>
                                <td className="border border-slate-300 p-4">
                                    Pessoas que, em decorrência dos efeitos diretos do desastre, precisaram desocupar seus domicílios, mas não necessitam de abrigo público.
                                </td>
                                <td className="border border-slate-300 p-4">
                                    Pessoas afetadas diretamente pelo desastre e que necessitam de intervenção pública para ações de resposta. Ex.: desaparecidos, isolados, enfermos, feridos, etc.
                                </td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className={tdClass}>
                                    <input type="number" min="0" className="w-full h-full p-4 text-center font-medium outline-none bg-transparent" placeholder="0" value={data.humanos_desabrigados || ""} onChange={(e) => handleChange('humanos_desabrigados', e.target.value)} />
                                </td>
                                <td className={tdClass}>
                                    <input type="number" min="0" className="w-full h-full p-4 text-center font-medium outline-none bg-transparent" placeholder="0" value={data.humanos_desalojados || ""} onChange={(e) => handleChange('humanos_desalojados', e.target.value)} />
                                </td>
                                <td className={tdClass}>
                                    <input type="number" min="0" className="w-full h-full p-4 text-center font-medium outline-none bg-transparent" placeholder="0" value={data.humanos_afetados || ""} onChange={(e) => handleChange('humanos_afetados', e.target.value)} />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ==========================================
                MUNICÍPIOS A SEREM CONTEMPLADOS
            ========================================== */}
            <div>
                <h3 className={sectionHeader}>MUNICÍPIOS A SEREM CONTEMPLADOS</h3>
                <div className="border border-slate-300 border-t-0 bg-white">
                    <textarea 
                        rows={3} 
                        className="w-full p-4 text-slate-800 outline-none resize-none focus:ring-2 focus:ring-pe-blue/20" 
                        placeholder="Ex: Abreu e Lima, Buenos Aires, Camaragibe..."
                        value={data.municipios_contemplados || ""}
                        onChange={(e) => handleChange('municipios_contemplados', e.target.value)}
                    />
                </div>
            </div>

            {/* ==========================================
                DESCRIÇÃO DAS METAS E ITENS
            ========================================== */}
            <div>
                <h3 className={sectionHeader}>DESCRIÇÃO DAS METAS E ITENS</h3>
                
                {/* Corpo da Meta 1 */}
                <div className="border border-slate-300 border-t-0 shadow-sm overflow-hidden">
                    
                    {/* Título da Meta */}
                    <div className="flex flex-col md:flex-row bg-slate-200 border-b border-slate-300">
                        <div className="p-3 font-bold text-slate-700 bg-slate-300 md:w-32 flex items-center justify-center">Meta 1:</div>
                        <input 
                            type="text" 
                            className="flex-1 p-3 bg-transparent outline-none font-medium text-slate-800 focus:bg-white transition-colors" 
                            placeholder="Nome da Meta (Ex: Cestas de alimentos)" 
                            value={data.meta_titulo || ""} 
                            onChange={(e) => handleChange('meta_titulo', e.target.value)} 
                        />
                    </div>

                    {/* Descrição da Meta */}
                    <div className="border-b border-slate-300 bg-white">
                        <textarea 
                            rows={2} 
                            className="w-full p-4 text-sm text-slate-700 outline-none resize-none focus:bg-slate-50" 
                            placeholder="Descrição da Meta (Ex: Destinadas às famílias desabrigadas e desalojadas...)"
                            value={data.meta_descricao || ""} 
                            onChange={(e) => handleChange('meta_descricao', e.target.value)} 
                        />
                    </div>

                    {/* Dados macro da Meta */}
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-slate-300 bg-slate-100 border-b">
                        <div>
                            <div className="text-center p-2 text-xs font-bold text-slate-600 border-b border-slate-300">Pessoas diretamente beneficiadas</div>
                            <input type="number" min="0" className="w-full p-3 text-center bg-white outline-none" placeholder="0" value={data.meta_pessoas || ""} onChange={(e) => handleChange('meta_pessoas', e.target.value)} />
                        </div>
                        <div>
                            <div className="text-center p-2 text-xs font-bold text-slate-600 border-b border-slate-300">Período de execução (em dias)</div>
                            <input type="number" min="0" className="w-full p-3 text-center bg-white outline-none" placeholder="0" value={data.meta_periodo || ""} onChange={(e) => handleChange('meta_periodo', e.target.value)} />
                        </div>
                        <div>
                            <div className="text-center p-2 text-xs font-bold text-slate-600 border-b border-slate-300">Valor total (R$) da Meta</div>
                            <div className="w-full p-3 text-center bg-slate-50 font-bold text-pe-blue border-t border-transparent">
                                {formatarMoeda(valorTotalGeral)}
                            </div>
                        </div>
                    </div>

                    {/* Tabela de Itens */}
                    <div className="overflow-x-auto bg-white">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-slate-200">
                                <tr>
                                    <th className="p-3 text-xs font-bold text-slate-700 w-16 border-r border-b border-slate-300">Item</th>
                                    <th className="p-3 text-xs font-bold text-slate-700 border-r border-b border-slate-300">Descrição do Item</th>
                                    <th className="p-3 text-xs font-bold text-slate-700 w-28 border-r border-b border-slate-300">Qtde.</th>
                                    <th className="p-3 text-xs font-bold text-slate-700 w-32 border-r border-b border-slate-300">Unid.</th>
                                    <th className="p-3 text-xs font-bold text-slate-700 w-32 border-r border-b border-slate-300">Período (dias)</th>
                                    <th className="p-3 text-xs font-bold text-slate-700 w-40 border-r border-b border-slate-300">Valor unitário (R$)</th>
                                    <th className="p-3 text-xs font-bold text-slate-700 w-48 border-b border-slate-300">Valor total (R$) do item</th>
                                    <th className="w-12 border-b border-slate-300"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {itensMeta.map((item, index) => {
                                    const qtde = Number(item.quantidade) || 0;
                                    const valorUn = Number(item.valor_unitario) || 0;
                                    const totalItem = qtde * valorUn;

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-200">{index + 1}</td>
                                            <td className="p-0 border-r border-slate-200">
                                                <input type="text" className="w-full p-3 bg-transparent outline-none" placeholder="Descrição do recurso..." value={item.descricao} onChange={(e) => handleItemChange(item.id, 'descricao', e.target.value)} />
                                            </td>
                                            <td className="p-0 border-r border-slate-200">
                                                <input type="number" min="0" className="w-full p-3 text-center bg-transparent outline-none" placeholder="0" value={item.quantidade} onChange={(e) => handleItemChange(item.id, 'quantidade', e.target.value)} />
                                            </td>
                                            <td className="p-0 border-r border-slate-200">
                                                <select className="w-full p-3 text-center bg-transparent outline-none text-sm" value={item.unidade} onChange={(e) => handleItemChange(item.id, 'unidade', e.target.value)}>
                                                    <option value="UNIDADES">UNIDADES</option>
                                                    <option value="KITS">KITS</option>
                                                    <option value="LITROS">LITROS</option>
                                                    <option value="KG">KG</option>
                                                    <option value="TON">TON</option>
                                                    <option value="CAIXAS">CAIXAS</option>
                                                </select>
                                            </td>
                                            <td className="p-0 border-r border-slate-200">
                                                <input type="number" min="0" className="w-full p-3 text-center bg-transparent outline-none" placeholder="0" value={item.periodo} onChange={(e) => handleItemChange(item.id, 'periodo', e.target.value)} />
                                            </td>
                                            <td className="p-0 border-r border-slate-200">
                                                <input type="number" step="0.01" min="0" className="w-full p-3 text-right bg-transparent outline-none" placeholder="0.00" value={item.valor_unitario} onChange={(e) => handleItemChange(item.id, 'valor_unitario', e.target.value)} />
                                            </td>
                                            <td className="p-3 text-right font-medium text-slate-700 bg-slate-50/50">
                                                {formatarMoeda(totalItem)}
                                            </td>
                                            <td className="p-0 text-center">
                                                <button 
                                                    type="button" 
                                                    onClick={() => removerItem(item.id)}
                                                    disabled={itensMeta.length === 1}
                                                    className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                                                    title="Remover Item"
                                                >
                                                    <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Rodapé da Meta (Adicionar Item e Total) */}
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-100 p-4 border-t border-slate-300 gap-4">
                        <button 
                            type="button" 
                            onClick={adicionarItem}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-[#003882] shadow-sm hover:bg-slate-50 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Adicionar Novo Item
                        </button>

                        <div className="flex items-center text-lg">
                            <span className="font-bold text-slate-700 mr-4">VALOR TOTAL:</span>
                            <span className="font-black text-[#003882] bg-white px-4 py-2 border border-slate-300 rounded-lg shadow-sm">
                                {formatarMoeda(valorTotalGeral)}
                            </span>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}