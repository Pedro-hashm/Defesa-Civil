"use client";

import AffectedAreasMap from "@/components/maps/AffectedAreasMap";

interface FideProps {
    fideData: any;
    setFideData: (data: any) => void;
}

export default function Fide({ fideData = {}, setFideData }: FideProps) {
    
    // Função auxiliar para atualizar o estado de forma mais limpa
    const handleChange = (field: string, value: any) => {
        setFideData((prev: any) => ({ ...prev, [field]: value }));
    };

    // Classes utilitárias padronizadas responsivas (aumentam no desktop)
    const sectionHeader = "bg-slate-500 text-white font-bold p-3 text-sm md:text-base uppercase rounded-t-md mt-8";
    const subHeader = "bg-slate-200 text-slate-700 font-bold p-3 text-xs md:text-sm border border-slate-300";
    const inputClass = "w-full border border-slate-300 p-2 md:p-2.5 text-sm md:text-base focus:border-pe-blue focus:ring-1 focus:ring-pe-blue outline-none";
    const thClass = "border border-slate-300 bg-slate-100 p-3 text-xs md:text-sm font-bold text-slate-700 text-left";
    const tdClass = "border border-slate-300 p-3 text-sm md:text-base";
    const helperText = "text-[10px] md:text-xs text-slate-500 leading-tight";
    const labelClass = "block text-xs md:text-sm font-bold text-slate-700 mb-1.5";

    return (
        <div className="space-y-8">
            
            {/* ==========================================
                1. IDENTIFICAÇÃO
            ========================================== */}
            <div>
                <h3 className={sectionHeader}>1. IDENTIFICAÇÃO</h3>
                <div className="border border-slate-300 border-t-0 p-5 space-y-6 bg-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className={labelClass}>UF:</label>
                            <select className={inputClass} value={fideData.uf || ""} onChange={(e) => handleChange('uf', e.target.value)}>
                                <option value="">Selecione...</option>
                                <option value="PE">PE</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Município:</label>
                            <input type="text" className={inputClass} value={fideData.municipio || ""} onChange={(e) => handleChange('municipio', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Código IBGE:</label>
                            <input type="text" className={inputClass} value={fideData.codigo_ibge || ""} onChange={(e) => handleChange('codigo_ibge', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className={labelClass + " text-center"}>População (habitantes)</label>
                            <input type="number" className={inputClass} value={fideData.populacao || ""} onChange={(e) => handleChange('populacao', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass + " text-center"}>PIB (Anual)</label>
                            <input type="text" className={inputClass} value={fideData.pib_anual || ""} onChange={(e) => handleChange('pib_anual', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass + " text-center"}>Orçamento (anual)</label>
                            <input type="text" className={inputClass} value={fideData.orcamento_anual || ""} onChange={(e) => handleChange('orcamento_anual', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass + " text-center"}>Arrecadação (anual)</label>
                            <input type="text" className={inputClass} value={fideData.arrecadacao_anual || ""} onChange={(e) => handleChange('arrecadacao_anual', e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ==========================================
                2 E 3. TIPIFICAÇÃO E DATA
            ========================================== */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="flex flex-col">
                    <h3 className={sectionHeader + " mt-0"}>2. TIPIFICAÇÃO</h3>
                    <div className="border border-slate-300 border-t-0 p-5 bg-slate-50/50 flex-1">
                        <label className={labelClass}>SELECIONAR A TIPIFICAÇÃO (COBRADE)*</label>
                        <select className={inputClass + " mb-5"} value={fideData.cobrade || ""} onChange={(e) => handleChange('cobrade', e.target.value)}>
                            <option value="">Selecione o tipo de COBRADE</option>
                            <option value="1.3.2.1.4">1.3.2.1.4 - Tempestade Local/Convectiva - Chuvas Intensas</option>
                            <option value="1.4.1.1.0">1.4.1.1.0 - Estiagem</option>
                        </select>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>COBRADE</label>
                                <input type="text" readOnly className={inputClass + " bg-slate-100"} value={fideData.cobrade || ""} />
                            </div>
                            <div>
                                <label className={labelClass}>Denominação</label>
                                <input type="text" readOnly className={inputClass + " bg-slate-100"} value={fideData.cobrade ? "Preenchimento Automático" : ""} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col">
                    <h3 className={sectionHeader + " mt-0"}>3. DATA DA OCORRÊNCIA DO DESASTRE*</h3>
                    <div className="border border-slate-300 border-t-0 p-5 bg-slate-50/50 flex-1 flex flex-col justify-end">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                            <div>
                                <label className={labelClass + " text-center"}>Dia</label>
                                <input type="text" className={inputClass + " text-center"} placeholder="DD" value={fideData.dia || ""} onChange={(e) => handleChange('dia', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelClass + " text-center"}>Mês</label>
                                <input type="text" className={inputClass + " text-center"} placeholder="MM" value={fideData.mes || ""} onChange={(e) => handleChange('mes', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelClass + " text-center"}>Ano</label>
                                <input type="text" className={inputClass + " text-center"} placeholder="AAAA" value={fideData.ano || ""} onChange={(e) => handleChange('ano', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelClass + " text-center"}>Horário</label>
                                <input type="text" className={inputClass + " text-center"} placeholder="HH:MM" value={fideData.horario || ""} onChange={(e) => handleChange('horario', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==========================================
                4. ÁREA COM POPULAÇÃO AFETADA
            ========================================== */}
            <div>
                <h3 className={sectionHeader}>4. ÁREA COM POPULAÇÃO AFETADA</h3>
                <div className="border border-slate-300 border-t-0">
                    
                    <div className={subHeader}>4.1 Área com população afetada/Tipo de ocupação</div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[600px]">
                            <thead>
                                <tr>
                                    <th className={thClass}>Ocupação</th>
                                    <th className={thClass + " text-center"}>Não existe/<br/>Não afetada</th>
                                    <th className={thClass + " text-center"}>Urbana</th>
                                    <th className={thClass + " text-center"}>Rural</th>
                                    <th className={thClass + " text-center"}>Urbana e rural</th>
                                </tr>
                            </thead>
                            <tbody>
                                {['Residencial', 'Comercial', 'Industrial', 'Agrícola', 'Pecuária', 'Extrativismo vegetal', 'Reserva florestal ou APA', 'Mineração', 'Turismo e outras'].map((ocupacao) => {
                                    const fieldKey = `ocupacao_${ocupacao.toLowerCase().replace(/ /g, '_')}`;
                                    return (
                                        <tr key={ocupacao} className="hover:bg-slate-50/50 transition-colors">
                                            <td className={tdClass + " font-medium"}>{ocupacao}</td>
                                            {['nao_afetada', 'urbana', 'rural', 'ambas'].map((val) => (
                                                <td key={val} className={tdClass + " text-center"}>
                                                    <input 
                                                        type="radio" 
                                                        name={fieldKey} 
                                                        value={val}
                                                        className="w-4 h-4 text-pe-blue cursor-pointer"
                                                        checked={fideData[fieldKey] === val}
                                                        onChange={(e) => handleChange(fieldKey, e.target.value)}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className={subHeader}>4.2 Seleção das áreas com população afetada</div>
                    <div className="p-5 bg-slate-50">
                        <AffectedAreasMap
                            value={fideData.mapa_geojson || ""}
                            onChange={(geojson) => handleChange("mapa_geojson", geojson)}
                        />
                    </div>

                    <div className={subHeader}>4.3 Descrição das áreas com população afetada</div>
                    <div className="p-5">
                        <textarea 
                            rows={3} 
                            className={inputClass} 
                            placeholder="Nome dos bairros, comunidades, povoados..."
                            value={fideData.descricao_areas || ""}
                            onChange={(e) => handleChange('descricao_areas', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* ==========================================
                5. CAUSAS E EFEITOS DO DESASTRE
            ========================================== */}
            <div>
                <h3 className={sectionHeader}>5. CAUSAS E EFEITOS DO DESASTRE</h3>
                <div className="border border-slate-300 border-t-0 p-5">
                    <p className={helperText + " mb-3"}>Descrever o evento adverso que causou o desastre e as características que demonstraram sua magnitude. (Duração, velocidade do vento, milímetros de chuva, etc).</p>
                    <textarea 
                        rows={4} 
                        className={inputClass}
                        value={fideData.causas_efeitos || ""}
                        onChange={(e) => handleChange('causas_efeitos', e.target.value)}
                    />
                </div>
            </div>

            {/* ==========================================
                6. DANOS HUMANOS, MATERIAIS OU AMBIENTAIS
            ========================================== */}
            <div>
                <h3 className={sectionHeader}>6. DANOS HUMANOS, MATERIAIS OU AMBIENTAIS</h3>
                <div className="border border-slate-300 border-t-0">
                    
                    {/* 6.1 Danos Humanos */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[600px]">
                            <thead>
                                <tr>
                                    <th colSpan={2} className={subHeader}>6.1 DANOS HUMANOS</th>
                                    <th className={subHeader + " text-center w-32 md:w-48"}>Quantidade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { k: 'mortos', l: 'Mortos', d: 'Pessoas que perderam suas vidas em decorrência direta dos efeitos do desastre.' },
                                    { k: 'feridos', l: 'Feridos', d: 'Pessoas que sofreram lesões em decorrência direta dos efeitos do desastre.' },
                                    { k: 'enfermos', l: 'Enfermos', d: 'Pessoas que desenvolveram processos patológicos em decorrência direta.' },
                                    { k: 'desabrigados', l: 'Desabrigados', d: 'Pessoas que necessitam de abrigo público (habitação temporária).' },
                                    { k: 'desalojados', l: 'Desalojados', d: 'Pessoas que desocuparam seus domicílios, mas não necessitam de abrigo público.' },
                                    { k: 'desaparecidos', l: 'Desaparecidos', d: 'Pessoas que necessitam ser encontradas em situação de risco de morte iminente.' },
                                    { k: 'outros', l: 'Outros afetados', d: 'Pessoas afetadas diretamente (excetuando as já informadas acima).' }
                                ].map((item) => (
                                    <tr key={item.k} className="hover:bg-slate-50/50 transition-colors">
                                        <td className={tdClass + " font-bold w-40 md:w-56"}>{item.l}</td>
                                        <td className={tdClass + " " + helperText}>{item.d}</td>
                                        <td className={tdClass + " p-0"}>
                                            <input type="number" className="w-full h-full p-3 text-center outline-none bg-transparent" min="0" 
                                                value={fideData[`humanos_${item.k}`] || 0}
                                                onChange={(e) => handleChange(`humanos_${item.k}`, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-100">
                                    <td colSpan={2} className={tdClass + " font-bold uppercase text-right"}>
                                        Total de Afetados
                                    </td>
                                    <td className={tdClass + " font-bold text-center text-lg text-pe-blue"}>
                                        0
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className={subHeader + " mt-6"}>6.1.1 Descrição</div>
                    <div className="p-5">
                        <textarea rows={2} className={inputClass} placeholder="Registrar informações adicionais e específicas de cada um dos danos humanos..."
                            value={fideData.desc_humanos || ""} onChange={(e) => handleChange('desc_humanos', e.target.value)} />
                    </div>

                    {/* 6.2 Danos Materiais */}
                    <div className="overflow-x-auto mt-6">
                        <table className="w-full border-collapse min-w-[700px]">
                            <thead>
                                <tr>
                                    <th className={subHeader}>6.2 DANOS MATERIAIS</th>
                                    <th className={subHeader + " text-center w-32 md:w-40"}>Qtd. Danificadas</th>
                                    <th className={subHeader + " text-center w-32 md:w-40"}>Qtd. Destruídas</th>
                                    <th className={subHeader + " text-center w-32 md:w-48"}>Valor (R$)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { k: 'habitacionais', l: 'Unidades habitacionais' },
                                    { k: 'saude', l: 'Instalações públicas de saúde' },
                                    { k: 'ensino', l: 'Instalações públicas de ensino' },
                                    { k: 'outros_servicos', l: 'Instalações públicas prestadoras de outros serviços' },
                                    { k: 'comunitario', l: 'Instalações públicas de uso comunitário' },
                                    { k: 'infraestrutura', l: 'Obras de infraestrutura pública' }
                                ].map((item) => (
                                    <tr key={item.k} className="hover:bg-slate-50/50 transition-colors">
                                        <td className={tdClass + " font-medium md:font-bold"}>{item.l}</td>
                                        <td className={tdClass + " p-0"}><input type="number" className="w-full h-full p-3 text-center outline-none bg-transparent" min="0" value={fideData[`mat_${item.k}_dan`] || 0} onChange={(e) => handleChange(`mat_${item.k}_dan`, e.target.value)} /></td>
                                        <td className={tdClass + " p-0"}><input type="number" className="w-full h-full p-3 text-center outline-none bg-transparent" min="0" value={fideData[`mat_${item.k}_des`] || 0} onChange={(e) => handleChange(`mat_${item.k}_des`, e.target.value)} /></td>
                                        <td className={tdClass + " p-0"}><input type="number" step="0.01" className="w-full h-full p-3 text-right outline-none bg-transparent" placeholder="0,00" value={fideData[`mat_${item.k}_val`] || ""} onChange={(e) => handleChange(`mat_${item.k}_val`, e.target.value)} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className={subHeader + " mt-6"}>6.2.1 Descrição</div>
                    <div className="p-5">
                        <textarea rows={2} className={inputClass} placeholder="Nome da instituição danificada e/ou destruída, localidade e bens materiais..."
                            value={fideData.desc_materiais || ""} onChange={(e) => handleChange('desc_materiais', e.target.value)} />
                    </div>

                    {/* 6.3 Danos Ambientais */}
                    <div className="overflow-x-auto mt-6">
                        <table className="w-full border-collapse min-w-[700px]">
                            <thead>
                                <tr>
                                    <th className={subHeader}>
                                        <div className="flex flex-col">
                                            <span>6.3 DANOS AMBIENTAIS</span>
                                            <span className="text-[10px] md:text-xs font-normal leading-tight mt-1.5 text-slate-500 normal-case">
                                                Informar as alterações ocorridas no meio ambiente que comprometeram a qualidade ambiental.
                                            </span>
                                        </div>
                                    </th>
                                    <th className={subHeader + " text-center w-20"}>Sim</th>
                                    <th className={subHeader + " text-center w-20"}>Não</th>
                                    <th className={subHeader + " text-center w-64"}>População do município atingida</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { k: 'agua', l: 'Poluição ou contaminação da água' },
                                    { k: 'ar', l: 'Poluição ou contaminação do ar' },
                                    { k: 'solo', l: 'Poluição ou contaminação do solo' },
                                    { k: 'hidrico', l: 'Diminuição ou exaurimento hídrico' }
                                ].map((item) => (
                                    <tr key={item.k} className="hover:bg-slate-50/50 transition-colors">
                                        <td className={tdClass + " font-medium"}>{item.l}</td>
                                        <td className={tdClass + " text-center"}>
                                            <input type="radio" className="w-4 h-4 text-pe-blue cursor-pointer" name={`amb_${item.k}_sn`} value="sim" checked={fideData[`amb_${item.k}_sn`] === 'sim'} onChange={(e) => handleChange(`amb_${item.k}_sn`, e.target.value)} />
                                        </td>
                                        <td className={tdClass + " text-center"}>
                                            <input type="radio" className="w-4 h-4 text-pe-blue cursor-pointer" name={`amb_${item.k}_sn`} value="nao" checked={fideData[`amb_${item.k}_sn`] === 'nao'} onChange={(e) => handleChange(`amb_${item.k}_sn`, e.target.value)} />
                                        </td>
                                        <td className={tdClass + " p-0"}>
                                            <select 
                                                className="w-full h-full p-3 outline-none text-sm md:text-base text-center bg-transparent disabled:opacity-30 disabled:bg-slate-50 cursor-pointer" 
                                                disabled={fideData[`amb_${item.k}_sn`] !== 'sim'} 
                                                value={fideData[`amb_${item.k}_pop`] || ""} 
                                                onChange={(e) => handleChange(`amb_${item.k}_pop`, e.target.value)}
                                            >
                                                <option value="">Selecione</option>
                                                <option value="ate_10">Até 10%</option>
                                                <option value="11_a_30">11% a 30%</option>
                                                <option value="31_a_50">31% a 50%</option>
                                                <option value="mais_50">Mais de 50%</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                                
                                {/* Cabecalho intermediario para Incendios */}
                                <tr>
                                    <td className={tdClass + " bg-slate-50"}></td>
                                    <td className={subHeader + " text-center"}>Sim</td>
                                    <td className={subHeader + " text-center"}>Não</td>
                                    <td className={subHeader + " text-center"}>Área atingida</td>
                                </tr>
                                
                                <tr className="hover:bg-slate-50/50 transition-colors">
                                    <td className={tdClass + " font-medium"}>Incêndios em parques, APA's ou APP's</td>
                                    <td className={tdClass + " text-center"}>
                                        <input type="radio" className="w-4 h-4 text-pe-blue cursor-pointer" name="amb_incendio_sn" value="sim" checked={fideData['amb_incendio_sn'] === 'sim'} onChange={(e) => handleChange('amb_incendio_sn', e.target.value)} />
                                    </td>
                                    <td className={tdClass + " text-center"}>
                                        <input type="radio" className="w-4 h-4 text-pe-blue cursor-pointer" name="amb_incendio_sn" value="nao" checked={fideData['amb_incendio_sn'] === 'nao'} onChange={(e) => handleChange('amb_incendio_sn', e.target.value)} />
                                    </td>
                                    <td className={tdClass + " p-0"}>
                                        <select 
                                            className="w-full h-full p-3 outline-none text-sm md:text-base text-center bg-transparent disabled:opacity-30 disabled:bg-slate-50 cursor-pointer" 
                                            disabled={fideData['amb_incendio_sn'] !== 'sim'} 
                                            value={fideData['amb_incendio_area'] || ""} 
                                            onChange={(e) => handleChange('amb_incendio_area', e.target.value)}
                                        >
                                            <option value="">Selecione</option>
                                            <option value="ate_10">Até 10%</option>
                                            <option value="11_a_30">11% a 30%</option>
                                            <option value="31_a_50">31% a 50%</option>
                                            <option value="mais_50">Mais de 50%</option>
                                        </select>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className={subHeader + " mt-6"}>6.3.1 Descrição</div>
                    <div className="p-5">
                        <textarea rows={2} className={inputClass} placeholder="Registrar informações adicionais e específicas de cada um dos danos ambientais citados..."
                            value={fideData.desc_ambientais || ""} onChange={(e) => handleChange('desc_ambientais', e.target.value)} />
                    </div>

                </div>
            </div>

            {/* ==========================================
                7. PREJUÍZOS ECONÔMICOS
            ========================================== */}
            <div>
                <h3 className={sectionHeader}>7. PREJUÍZOS ECONÔMICOS PÚBLICOS E PRIVADOS</h3>
                <div className="border border-slate-300 border-t-0">
                    
                    {/* 7.1 Públicos */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[500px]">
                            <thead>
                                <tr>
                                    <th className={subHeader}>7.1 PREJUÍZOS PÚBLICOS</th>
                                    <th className={subHeader + " text-right w-48 md:w-64"}>Valor do prejuízo (R$)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { k: 'saude', l: 'Assistência médica, saúde pública e atendimento de emergências médicas' },
                                    { k: 'agua', l: 'Abastecimento de água potável' },
                                    { k: 'esgoto', l: 'Esgoto de águas pluviais e sistema de esgotos sanitários' },
                                    { k: 'lixo', l: 'Sistema de limpeza urbana e destinação do lixo' },
                                    { k: 'energia', l: 'Geração e distribuição de energia elétrica' },
                                    { k: 'telecom', l: 'Telecomunicações' },
                                    { k: 'transporte', l: 'Transportes locais, regionais e de longo curso' },
                                    { k: 'seguranca', l: 'Segurança pública' },
                                    { k: 'ensino', l: 'Ensino' }
                                ].map((item) => (
                                    <tr key={item.k} className="hover:bg-slate-50/50 transition-colors">
                                        <td className={tdClass + " font-medium"}>{item.l}</td>
                                        <td className={tdClass + " p-0"}><input type="number" step="0.01" className="w-full h-full p-3 text-right outline-none bg-transparent" placeholder="0,00" value={fideData[`prej_pub_${item.k}`] || ""} onChange={(e) => handleChange(`prej_pub_${item.k}`, e.target.value)} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className={subHeader + " mt-6"}>7.1.1 Descrição</div>
                    <div className="p-5">
                        <textarea rows={3} className={inputClass} placeholder="Descrever como o efeito do desastre causou os prejuízos citados..."
                            value={fideData.desc_prej_pub || ""} onChange={(e) => handleChange('desc_prej_pub', e.target.value)} />
                    </div>

                    {/* 7.2 Privados */}
                    <div className="overflow-x-auto mt-6">
                        <table className="w-full border-collapse min-w-[500px]">
                            <thead>
                                <tr>
                                    <th className={subHeader}>7.2 PREJUÍZOS PRIVADOS</th>
                                    <th className={subHeader + " text-right w-48 md:w-64"}>Valor do prejuízo (R$)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { k: 'agricultura', l: 'Agricultura' },
                                    { k: 'pecuaria', l: 'Pecuária' },
                                    { k: 'industria', l: 'Indústria' },
                                    { k: 'comercio', l: 'Comércio' },
                                    { k: 'servicos', l: 'Serviços' }
                                ].map((item) => (
                                    <tr key={item.k} className="hover:bg-slate-50/50 transition-colors">
                                        <td className={tdClass + " font-medium"}>{item.l}</td>
                                        <td className={tdClass + " p-0"}><input type="number" step="0.01" className="w-full h-full p-3 text-right outline-none bg-transparent" placeholder="0,00" value={fideData[`prej_priv_${item.k}`] || ""} onChange={(e) => handleChange(`prej_priv_${item.k}`, e.target.value)} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className={subHeader + " mt-6"}>7.2.1 Descrição</div>
                    <div className="p-5">
                        <textarea rows={3} className={inputClass} placeholder="Descrever como o efeito do desastre causou os prejuízos citados..."
                            value={fideData.desc_prej_priv || ""} onChange={(e) => handleChange('desc_prej_priv', e.target.value)} />
                    </div>
                </div>
            </div>

        </div>
    );
}