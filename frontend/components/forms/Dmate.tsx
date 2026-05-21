"use client";

interface DmateProps {
    dmateData: any;
    setDmateData: (data: any) => void;
}

export default function Dmate({ dmateData = {}, setDmateData }: DmateProps) {
    
    // Função auxiliar para atualizar o estado de forma mais limpa
    const handleChange = (field: string, value: any) => {
        setDmateData((prev: any) => ({ ...prev, [field]: value }));
    };

    // Classes utilitárias padronizadas responsivas (herdadas do FIDE)
    const sectionHeader = "bg-slate-500 text-white font-bold p-3 text-sm md:text-base uppercase rounded-t-md mt-8";
    const subHeader = "bg-slate-200 text-slate-700 font-bold p-3 text-xs md:text-sm border border-slate-300";
    const inputClass = "w-full border border-slate-300 p-2 md:p-2.5 text-sm md:text-base focus:border-pe-blue focus:ring-1 focus:ring-pe-blue outline-none";
    const thClass = "border border-slate-300 bg-slate-100 p-3 text-xs md:text-sm font-bold text-slate-700 text-left";
    const tdClass = "border border-slate-300 p-3 text-sm md:text-base";

    // Componente reutilizável para linhas de Sim/Não para evitar código repetitivo
    const renderSimNaoRow = (key: string, label: string) => (
        <tr key={key} className="hover:bg-slate-50/50 transition-colors">
            <td className={tdClass + " font-medium"}>{label}</td>
            <td className={tdClass + " text-center"}>
                <input type="radio" className="w-4 h-4 text-pe-blue cursor-pointer" name={key} value="sim" checked={dmateData[key] === 'sim'} onChange={(e) => handleChange(key, e.target.value)} />
            </td>
            <td className={tdClass + " text-center"}>
                <input type="radio" className="w-4 h-4 text-pe-blue cursor-pointer" name={key} value="nao" checked={dmateData[key] === 'nao'} onChange={(e) => handleChange(key, e.target.value)} />
            </td>
        </tr>
    );

    return (
        <div className="space-y-8">
            
            {/* ==========================================
                1. CARACTERIZAÇÃO DE SITUAÇÃO
            ========================================== */}
            <div>
                <h3 className={sectionHeader}>1. CARACTERIZAÇÃO DE SITUAÇÃO DE EMERGÊNCIA OU CALAMIDADE PÚBLICA</h3>
                <div className="border border-slate-300 border-t-0">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[500px]">
                            <thead>
                                <tr>
                                    <th className={subHeader}>Critérios</th>
                                    <th className={subHeader + " text-center w-20"}>Sim</th>
                                    <th className={subHeader + " text-center w-20"}>Não</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderSimNaoRow('s1_cap_superada', 'A magnitude do evento superou a capacidade de gestão do desastre pelo poder público municipal?')}
                                {renderSimNaoRow('s1_cap_comprometida', 'Os danos e prejuízos comprometeram a capacidade de resposta do poder público municipal?')}
                                {renderSimNaoRow('s1_prej_causados', 'Os prejuízos econômicos foram causados por esse desastre?')}
                                {renderSimNaoRow('s1_prej_separados', 'Os prejuízos econômicos públicos desse desastre foram separados dos privados?')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className={subHeader + " mt-0 border-t-0"}>Informe, resumidamente, esses danos e prejuízos:</div>
                    <div className="p-5">
                        <textarea rows={3} className={inputClass} placeholder="Resumo dos danos e prejuízos..."
                            value={dmateData.s1_informe_resumido || ""} onChange={(e) => handleChange('s1_informe_resumido', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* ==========================================
                2. INFORMAÇÕES RELEVANTES SOBRE O DESASTRE
            ========================================== */}
            <div>
                <h3 className={sectionHeader}>2. INFORMAÇÕES RELEVANTES SOBRE O DESASTRE</h3>
                <div className="border border-slate-300 border-t-0">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[500px]">
                            <thead>
                                <tr>
                                    <th className={subHeader}>2.1 HISTÓRICO DE DESASTRE</th>
                                    <th className={subHeader + " text-center w-20"}>Sim</th>
                                    <th className={subHeader + " text-center w-20"}>Não</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderSimNaoRow('s2_ocorreu_ant', 'Esse tipo de evento já ocorreu anteriormente?')}
                                {renderSimNaoRow('s2_ocorre_anual', 'Esse tipo de evento ocorre anual e repetidamente?')}
                            </tbody>
                        </table>
                    </div>

                    <div className={subHeader + " mt-0 border-t-0 font-normal leading-tight"}>
                        <b>Se este tipo de desastre ocorre repetida e/ou anualmente</b>, cite as ações preventivas já desenvolvidas pelo município e explique porque ainda exige ação emergencial:
                    </div>
                    <div className="p-5">
                        <textarea rows={3} className={inputClass} placeholder="Ações preventivas..."
                            value={dmateData.s2_acoes_preventivas || ""} onChange={(e) => handleChange('s2_acoes_preventivas', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* ==========================================
                3. CAPACIDADE GERENCIAL DO MUNICÍPIO
            ========================================== */}
            <div>
                <h3 className={sectionHeader}>3. INFORMAÇÕES SOBRE A CAPACIDADE GERENCIAL DO MUNICÍPIO</h3>
                <div className="border border-slate-300 border-t-0">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[500px]">
                            <thead>
                                <tr>
                                    <th className={subHeader}>3.1 PLANEJAMENTO ESTRATÉGICO/TÁTICO/OPERACIONAL MUNICIPAL</th>
                                    <th className={subHeader + " text-center w-20"}>Sim</th>
                                    <th className={subHeader + " text-center w-20"}>Não</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderSimNaoRow('s3_mapeamento', 'Já foi efetuado o mapeamento das áreas de risco no município?')}
                                {renderSimNaoRow('s3_orgao_dc', 'O município possui órgão de defesa civil?')}
                                {renderSimNaoRow('s3_plano_cont', 'Existe plano de contingência para o tipo de desastre ocorrido?')}
                                {renderSimNaoRow('s3_recurso_loa', 'Esse desastre foi previsto e tem recurso orçamentário na LOA atual?')}
                                {renderSimNaoRow('s3_inclusao_ppa', 'Existe um programa/projeto para enfrentamento desse problema com inclusão no PPA?')}
                                {renderSimNaoRow('s3_simulados', 'Foram realizados simulados com a população nas áreas de risco do município?')}
                                {renderSimNaoRow('s3_apoio_est', 'Órgãos e instituições estaduais apoiam a defesa civil municipal?')}
                            </tbody>
                        </table>
                    </div>

                    <div className={subHeader + " mt-0 border-t-0"}>Informe as dificuldades do município para a gestão do desastre:</div>
                    <div className="p-5">
                        <textarea rows={3} className={inputClass} placeholder="Dificuldades do município..."
                            value={dmateData.s3_dificuldades || ""} onChange={(e) => handleChange('s3_dificuldades', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* ==========================================
                4. MEDIDAS E AÇÕES EM CURSO
            ========================================== */}
            <div>
                <h3 className={sectionHeader}>4. MEDIDAS E AÇÕES EM CURSO</h3>
                <div className="border border-slate-300 border-t-0">
                    
                    {/* 4.1 Humanos */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[700px]">
                            <thead>
                                <tr>
                                    <th className={subHeader}>4.1 MOBILIZAÇÃO E EMPREGO DE RECURSOS HUMANOS E INSTITUCIONAIS</th>
                                    <th className={subHeader + " text-center w-20"}>Sim</th>
                                    <th className={subHeader + " text-center w-20"}>Não</th>
                                    <th className={subHeader + " text-center w-32"}>Quantidade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { k: 'ajuda', l: 'Ajuda humanitária' },
                                    { k: 'saude_pub', l: 'Apoio à saúde e saúde pública' },
                                    { k: 'medica', l: 'Assistência médica' },
                                    { k: 'aval_danos', l: 'Avaliação de danos' },
                                    { k: 'busca', l: 'Busca, resgate e salvamento' },
                                    { k: 'outros_hum', l: 'Outros' },
                                    { k: 'comunicacao', l: 'Promoção, assistência e comunicação social' },
                                    { k: 'reabilitacao', l: 'Reabilitação de cenários (obras públicas e serviços gerais)' },
                                    { k: 'seguranca', l: 'Segurança pública' }
                                ].map((item) => (
                                    <tr key={item.k} className="hover:bg-slate-50/50 transition-colors">
                                        <td className={tdClass + " font-medium"}>{item.l}</td>
                                        <td className={tdClass + " text-center"}>
                                            <input type="radio" className="w-4 h-4 text-pe-blue cursor-pointer" name={`s4_hum_${item.k}_sn`} value="sim" checked={dmateData[`s4_hum_${item.k}_sn`] === 'sim'} onChange={(e) => handleChange(`s4_hum_${item.k}_sn`, e.target.value)} />
                                        </td>
                                        <td className={tdClass + " text-center"}>
                                            <input type="radio" className="w-4 h-4 text-pe-blue cursor-pointer" name={`s4_hum_${item.k}_sn`} value="nao" checked={dmateData[`s4_hum_${item.k}_sn`] === 'nao'} onChange={(e) => handleChange(`s4_hum_${item.k}_sn`, e.target.value)} />
                                        </td>
                                        <td className={tdClass + " p-0"}>
                                            <input type="number" className="w-full h-full p-3 text-center outline-none bg-transparent disabled:opacity-30 disabled:bg-slate-50" min="0" 
                                                disabled={dmateData[`s4_hum_${item.k}_sn`] !== 'sim'}
                                                value={dmateData[`s4_hum_${item.k}_qtd`] || 0} onChange={(e) => handleChange(`s4_hum_${item.k}_qtd`, e.target.value)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className={subHeader + " mt-0 border-t-0 font-normal leading-tight"}>
                        Descrever outros e/ou detalhar, quando for o caso, o pessoal e equipes já empregados ou mobilizados.
                    </div>
                    <div className="p-5">
                        <textarea rows={2} className={inputClass} placeholder="Detalhes..." value={dmateData.s4_desc_humanos || ""} onChange={(e) => handleChange('s4_desc_humanos', e.target.value)} />
                    </div>

                    {/* 4.2 Materiais */}
                    <div className="overflow-x-auto mt-6">
                        <table className="w-full border-collapse min-w-[700px]">
                            <thead>
                                <tr>
                                    <th className={subHeader}>4.2 MOBILIZAÇÃO E EMPREGO DE RECURSOS MATERIAIS</th>
                                    <th className={subHeader + " text-center w-20"}>Sim</th>
                                    <th className={subHeader + " text-center w-20"}>Não</th>
                                    <th className={subHeader + " text-center w-32"}>Quantidade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { k: 'agua', l: 'Água potável/Alimentos/Medicamentos' },
                                    { k: 'maquinas', l: 'Equipamentos e máquinas' },
                                    { k: 'transportes', l: 'Helicópteros, barcos, veículos, ambulâncias, outros meios de transporte' },
                                    { k: 'limpeza', l: 'Material de limpeza, desinfecção, desinfestação e controle de pragas e vetores' },
                                    { k: 'uso_pessoal', l: 'Material de uso pessoal (asseio e higiene, utensílios domésticos, vestuário, calçados, etc)' },
                                    { k: 'outros_mat', l: 'Outros' }
                                ].map((item) => (
                                    <tr key={item.k} className="hover:bg-slate-50/50 transition-colors">
                                        <td className={tdClass + " font-medium"}>{item.l}</td>
                                        <td className={tdClass + " text-center"}>
                                            <input type="radio" className="w-4 h-4 text-pe-blue cursor-pointer" name={`s4_mat_${item.k}_sn`} value="sim" checked={dmateData[`s4_mat_${item.k}_sn`] === 'sim'} onChange={(e) => handleChange(`s4_mat_${item.k}_sn`, e.target.value)} />
                                        </td>
                                        <td className={tdClass + " text-center"}>
                                            <input type="radio" className="w-4 h-4 text-pe-blue cursor-pointer" name={`s4_mat_${item.k}_sn`} value="nao" checked={dmateData[`s4_mat_${item.k}_sn`] === 'nao'} onChange={(e) => handleChange(`s4_mat_${item.k}_sn`, e.target.value)} />
                                        </td>
                                        <td className={tdClass + " p-0"}>
                                            <input type="number" className="w-full h-full p-3 text-center outline-none bg-transparent disabled:opacity-30 disabled:bg-slate-50" min="0" 
                                                disabled={dmateData[`s4_mat_${item.k}_sn`] !== 'sim'}
                                                value={dmateData[`s4_mat_${item.k}_qtd`] || 0} onChange={(e) => handleChange(`s4_mat_${item.k}_qtd`, e.target.value)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className={subHeader + " mt-0 border-t-0 font-normal leading-tight"}>
                        Descrever e/ou detalhar, quando for o caso, os materiais e equipamentos já empregados ou providenciados.
                    </div>
                    <div className="p-5">
                        <textarea rows={2} className={inputClass} placeholder="Detalhes..." value={dmateData.s4_desc_materiais || ""} onChange={(e) => handleChange('s4_desc_materiais', e.target.value)} />
                    </div>

                    {/* 4.3 Financeiros */}
                    <div className="overflow-x-auto mt-6">
                        <table className="w-full border-collapse min-w-[700px]">
                            <thead>
                                <tr>
                                    <th className={subHeader}>4.3 MOBILIZAÇÃO E EMPREGO DE RECURSOS FINANCEIROS</th>
                                    <th className={subHeader + " text-center w-20"}>Sim</th>
                                    <th className={subHeader + " text-center w-20"}>Não</th>
                                    <th className={subHeader + " text-center w-40"}>Valor (R$)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { k: 'mun', l: 'Oriundos de fonte orçamentária municipal' },
                                    { k: 'extra_mun', l: 'Oriundos de fonte extra orçamentária municipal' },
                                    { k: 'doacoes', l: 'Oriundos de doações: pessoas físicas, pessoas jurídicas, ONGs' },
                                    { k: 'outras', l: 'Oriundos de outras fontes' }
                                ].map((item) => (
                                    <tr key={item.k} className="hover:bg-slate-50/50 transition-colors">
                                        <td className={tdClass + " font-medium"}>{item.l}</td>
                                        <td className={tdClass + " text-center"}>
                                            <input type="radio" className="w-4 h-4 text-pe-blue cursor-pointer" name={`s4_fin_${item.k}_sn`} value="sim" checked={dmateData[`s4_fin_${item.k}_sn`] === 'sim'} onChange={(e) => handleChange(`s4_fin_${item.k}_sn`, e.target.value)} />
                                        </td>
                                        <td className={tdClass + " text-center"}>
                                            <input type="radio" className="w-4 h-4 text-pe-blue cursor-pointer" name={`s4_fin_${item.k}_sn`} value="nao" checked={dmateData[`s4_fin_${item.k}_sn`] === 'nao'} onChange={(e) => handleChange(`s4_fin_${item.k}_sn`, e.target.value)} />
                                        </td>
                                        <td className={tdClass + " p-0"}>
                                            <input type="number" step="0.01" className="w-full h-full p-3 text-right outline-none bg-transparent disabled:opacity-30 disabled:bg-slate-50" placeholder="0,00" 
                                                disabled={dmateData[`s4_fin_${item.k}_sn`] !== 'sim'}
                                                value={dmateData[`s4_fin_${item.k}_val`] || ""} onChange={(e) => handleChange(`s4_fin_${item.k}_val`, e.target.value)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className={subHeader + " mt-0 border-t-0 font-normal leading-tight"}>
                        Descrever e/ou detalhar:
                    </div>
                    <div className="p-5">
                        <textarea rows={2} className={inputClass} placeholder="Detalhes dos recursos financeiros..." value={dmateData.s4_desc_financeiros || ""} onChange={(e) => handleChange('s4_desc_financeiros', e.target.value)} />
                    </div>

                </div>
            </div>

        </div>
    );
}