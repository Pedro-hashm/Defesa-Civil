"use client";

const COMUNICADOS = [
  {
    id: 1,
    titulo: "Instabilidade no Módulo de Envio de Relatórios",
    data: "Hoje, 20:15",
    tipo: "SISTEMA",
    descricao: "Detectamos uma oscilação no servidor de arquivos. Caso encontre erro ao anexar fotos em simulações, tente novamente em instantes. Nossa equipe de TI já está atuando.",
    lido: false,
  },
  {
    id: 2,
    titulo: "Manutenção Preventiva Agendada",
    data: "Ontem, 14:00",
    tipo: "SISTEMA",
    descricao: "O portal passará por manutenção para atualização do banco de dados no domingo (19/04) entre 02:00 e 04:00. O acesso ao simulador estará temporariamente indisponível.",
    lido: true,
  },
  {
    id: 3,
    titulo: "Alerta Meteorológico: Chuvas Intensas na RMR",
    data: "15 de Abril, 2026",
    tipo: "ALERTA",
    descricao: "Previsão de acumulados significativos de chuva para a Região Metropolitana do Recife nas próximas 48h. Todas as equipes devem revisar os formulários de áreas de risco e preparar simulações de deslizamento.",
    lido: false,
  },
  {
    id: 4,
    titulo: "Atualização no Formulário de Vistoria Estrutural",
    data: "12 de Abril, 2026",
    tipo: "SISTEMA",
    descricao: "O módulo simulador foi atualizado. O formulário de vistoria estrutural agora contém novos campos obrigatórios referentes ao nível de umidade do solo. Por favor, revisem os novos campos guiados.",
    lido: true,
  },
  {
    id: 5,
    titulo: "Novo curso disponível: Interpretação de Radar",
    data: "05 de Abril, 2026",
    tipo: "INFORMATIVO",
    descricao: "Estão abertas as inscrições para a nova capacitação técnica sobre interpretação de dados de radares meteorológicos. Obrigatório para alunos residentes.",
    lido: true,
  }
];

export default function ComunicadosPage() {
  const getBadgeStyle = (tipo: string) => {
    switch (tipo) {
      case "ALERTA":
        return "bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]"; // red-50, red-700, red-200
      case "SISTEMA":
        return "bg-[#fffbeb] text-[#b45309] border-[#fde68a]"; // amber-50, amber-700, amber-200
      case "INFORMATIVO":
      default:
        return "bg-[#eff6ff] text-[#003882] border-[#bfdbfe]"; // blue-50, pe-blue, blue-200
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
            Comunicados Oficiais
          </h1>
          <p className="mt-1 text-base text-[#64748b]">
            Acompanhe os avisos, alertas e atualizações do sistema da Defesa Civil.
          </p>
        </div>
        
        <button className="inline-flex items-center gap-2 rounded-lg border border-[#cbd5e1] bg-[#ffffff] px-4 py-2 text-sm font-medium text-[#334155] transition hover:bg-[#f8fafc] hover:text-[#0f172a] shadow-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Marcar todos como lidos
        </button>
      </div>

      <div className="space-y-4">
        {COMUNICADOS.map((comunicado) => (
          <article 
            key={comunicado.id} 
            className={`relative flex flex-col gap-4 rounded-xl border bg-[#ffffff] p-5 shadow-sm sm:flex-row sm:items-start lg:p-6 transition-all hover:shadow-md ${
              !comunicado.lido ? "border-[#003882]/30" : "border-[#e2e8f0]"
            }`}
          >
            {!comunicado.lido && (
              <span className="absolute left-0 top-6 h-2 w-2 rounded-full bg-[#003882] sm:-left-1" />
            )}

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getBadgeStyle(comunicado.tipo)}`}>
                  {comunicado.tipo}
                </span>
                <time className="text-sm text-[#64748b] flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {comunicado.data}
                </time>
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#0f172a] hover:text-[#003882] transition-colors cursor-pointer">
                  {comunicado.titulo}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[#475569]">
                  {comunicado.descricao}
                </p>
              </div>
            </div>

            <div className="mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
              <button className="text-sm font-semibold text-[#003882] hover:text-[#002456] transition-colors flex items-center gap-1">
                Acessar detalhes
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </article>
        ))}
      </div>

    </div>
  );
}