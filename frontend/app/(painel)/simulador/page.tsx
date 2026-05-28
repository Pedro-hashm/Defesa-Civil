import Link from "next/link";

export default function SimuladorInicialPage() {
	return (
		<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
			
			{/* Cabeçalho */}
			<div className="flex flex-col gap-2 border-b border-slate-200 pb-6">
				<h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
					Simulador de Ocorrências
				</h1>
				<p className="mt-1 text-base text-[#64748b]">
					Selecione um cenário para iniciar seu treinamento prático de preenchimento de formulários oficiais.
				</p>
			</div>

			{/* Grid de Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				
				{/* CARD 1: FIDE + DMATE (Ativo) */}
				<article className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[#003882]/40">
					<div className="space-y-4">
						<div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-[#003882] group-hover:bg-[#003882] group-hover:text-white transition-colors">
							<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
						
						<div>
							<h2 className="text-lg font-bold text-slate-900 line-clamp-2">
								Declaração de Desastre (FIDE + DMATE)
							</h2>
							<p className="mt-2 text-sm text-slate-500 leading-relaxed">
								Simulação integrada do Formulário de Informações do Desastre e Declaração Municipal de Atuação Emergencial.
							</p>
						</div>

					</div>

					<div className="mt-8 pt-4 border-t border-slate-100">
						<Link
							href="/simulador/fide-dmate"
							className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#003882] px-4 py-2.5 text-sm font-bold text-white! transition-colors hover:bg-[#002456] shadow-sm"
						>
							Iniciar Simulação
							<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
							</svg>
						</Link>
					</div>
				</article>

				{/* CARD 2: Solicitação de Recursos (Em Breve) */}
				<article className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm opacity-80">
					<div className="space-y-4">
						<div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
							<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						
						<div>
							<h2 className="text-lg font-bold text-slate-700">
								Solicitação de Recursos
							</h2>
							<p className="mt-2 text-sm text-slate-500 leading-relaxed">
								Módulo focado no cálculo e solicitação de ajuda humanitária (kits, água, combustível) via S2iD.
							</p>
						</div>

					</div>

					<div className="mt-8 pt-4 border-t border-slate-200">
						<button
							disabled
							className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-400 cursor-not-allowed"
						>
							Em breve
						</button>
					</div>
				</article>

			</div>
		</div>
	);
}