"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";

// Tipagem baseada no retorno real do ComunicadoService
type Comunicado = {
	id: number;
	titulo: string;
	conteudo: string;
	publicado_em: string;
	atualizado_em: string;
	autor: {
		id: number;
		nome: string;
	};
};

export default function ComunicadosPage() {
	const [comunicados, setComunicados] = useState<Comunicado[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [erro, setErro] = useState("");
	
	// estado para guardar se é admin ou não
	const [isAdmin, setIsAdmin] = useState(false); 

	useEffect(() => {
		// Lê o localStorage para saber o cargo do usuário
		const usuarioStorage = localStorage.getItem("defesa-civil.usuario");
		if (usuarioStorage) {
			try {
				const usuario = JSON.parse(usuarioStorage);
				setIsAdmin(usuario.cargo === "ADMIN");
			} catch (error) {
				console.error("Erro ao ler usuário do localStorage", error);
			}
		}

		carregarComunicados();
	}, []);

	async function carregarComunicados() {
		setIsLoading(true);
		setErro("");
		try {
			const token = localStorage.getItem("defesa-civil.token");
			const res = await fetch(`${API_URL}/comunicados`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!res.ok) {
				throw new Error("Falha ao carregar os comunicados");
			}

			const data = await res.json();
			setComunicados(data);
		} catch (error: any) {
			setErro("Não foi possível carregar os comunicados. Tente novamente mais tarde.");
		} finally {
			setIsLoading(false);
		}
	}

	// Função para formatar a data que vem do banco (ISO) para o padrão brasileiro
	const formatarData = (dataIso: string) => {
		const data = new Date(dataIso);
		return new Intl.DateTimeFormat("pt-BR", {
			day: "2-digit",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(data);
	};

	return (
		<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			
			<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
						Comunicados Oficiais
					</h1>
					<p className="mt-1 text-base text-[#64748b]">
						Acompanhe os avisos e atualizações do sistema da Defesa Civil.
					</p>
				</div>
				
			</div>

			<div className="space-y-4">
				{isLoading ? (
					<div className="flex justify-center p-8 text-slate-500">
						Carregando comunicados...
					</div>
				) : erro ? (
					<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
						{erro}
					</div>
				) : comunicados.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-12 text-center">
						<p className="text-lg font-medium text-slate-900">Nenhum comunicado</p>
						<p className="mt-1 text-sm text-slate-500">Não há avisos publicados no momento.</p>
					</div>
				) : (
					comunicados.map((comunicado) => (
						<article 
							key={comunicado.id} 
							className="relative flex flex-col gap-4 rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-5 shadow-sm sm:flex-row sm:items-start lg:p-6 transition-all hover:shadow-md"
						>
							<div className="flex-1 space-y-3">
								<div className="flex flex-wrap items-center gap-3">
									<span className="inline-flex items-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-0.5 text-xs font-semibold text-[#003882]">
										INFORMATIVO
									</span>
									<time className="text-sm text-[#64748b] flex items-center gap-1.5">
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
										{formatarData(comunicado.publicado_em)}
									</time>
									<span className="text-sm text-slate-400">•</span>
									<span className="text-sm font-medium text-slate-600">
										Por {comunicado.autor.nome}
									</span>
								</div>

								<div>
									<h2 className="text-lg font-bold text-[#0f172a]">
										{comunicado.titulo}
									</h2>
									<p className="mt-1 text-sm leading-relaxed text-[#475569] whitespace-pre-wrap">
										{comunicado.conteudo}
									</p>
								</div>
							</div>

							{/* Renderiza a div com o link de edição apenas se for ADMIN */}
							{isAdmin && (
								<div className="mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
									<Link 
										href={`/comunicados/${comunicado.id}/editar`}
										className="text-sm font-semibold text-[#003882] hover:text-[#002456] transition-colors flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100"
									>
										Editar aviso
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
										</svg>
									</Link>
								</div>
							)}
						</article>
					))
				)}
			</div>
		</div>
	);
}