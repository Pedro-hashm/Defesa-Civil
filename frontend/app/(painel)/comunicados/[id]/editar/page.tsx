"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";

export default function EditarComunicadoPage() {
	const router = useRouter();
	const params = useParams(); // Pega o [id] da URL
	const comunicadoId = params.id;

	const [titulo, setTitulo] = useState("");
	const [conteudo, setConteudo] = useState("");
	
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [mensagem, setMensagem] = useState<{ texto: string; tipo: "sucesso" | "erro" } | null>(null);

	// Busca os dados atuais do comunicado ao carregar a página
	useEffect(() => {
		if (comunicadoId) {
			carregarComunicado();
		}
	}, [comunicadoId]);

	async function carregarComunicado() {
		try {
			const token = localStorage.getItem("defesa-civil.token");
			const res = await fetch(`${API_URL}/comunicados/${comunicadoId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!res.ok) throw new Error("Comunicado não encontrado.");

			const data = await res.json();
			setTitulo(data.titulo);
			setConteudo(data.conteudo);
		} catch (error: any) {
			setMensagem({ texto: "Erro ao carregar os dados do comunicado.", tipo: "erro" });
		} finally {
			setIsLoading(false);
		}
	}

	// --- AÇÕES DA API ---

	async function handleSalvar(e: FormEvent) {
		e.preventDefault();
		setIsSubmitting(true);
		setMensagem(null);

		const token = localStorage.getItem("defesa-civil.token");

		try {
			const res = await fetch(`${API_URL}/comunicados/${comunicadoId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					titulo,
					conteudo,
				}),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || "Erro ao atualizar comunicado.");
			}

			setMensagem({ texto: "Alterações salvas com sucesso!", tipo: "sucesso" });
			
			setTimeout(() => {
				router.push("/comunicados");
			}, 1500);

		} catch (error: any) {
			setMensagem({ texto: error.message, tipo: "erro" });
			setIsSubmitting(false);
		}
	}

	async function handleExcluir() {
		if (!confirm("Tem certeza que deseja excluir este comunicado? Esta ação é irreversível.")) {
			return;
		}

		setIsDeleting(true);
		const token = localStorage.getItem("defesa-civil.token");

		try {
			const res = await fetch(`${API_URL}/comunicados/${comunicadoId}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!res.ok) throw new Error("Erro ao excluir comunicado.");

			setMensagem({ texto: "Comunicado excluído com sucesso.", tipo: "sucesso" });
			
			setTimeout(() => {
				router.push("/comunicados");
			}, 1500);

		} catch (error: any) {
			setMensagem({ texto: "Não foi possível excluir o comunicado.", tipo: "erro" });
			setIsDeleting(false);
		}
	}

	// --- RENDERIZAÇÃO ---

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center text-slate-500">
				Carregando dados do comunicado...
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
			
			{/* Cabeçalho */}
			<div className="flex flex-col gap-2">
				<Link 
					href="/comunicados" 
					className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#003882] transition-colors w-fit"
				>
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
					Voltar para comunicados
				</Link>
				<h1 className="text-3xl font-bold tracking-tight text-slate-900">Editar Comunicado</h1>
				<p className="text-base text-slate-500">Faça correções ou remova o aviso do painel dos alunos.</p>
			</div>

			{/* Formulário (Card) */}
			<div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
				<form onSubmit={handleSalvar} className="flex flex-col">
					
					<div className="p-6 md:p-8 space-y-6">
						{mensagem && (
							<div className={`p-4 rounded-lg text-sm font-medium ${
								mensagem.tipo === "sucesso" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
							}`}>
								{mensagem.texto}
							</div>
						)}

						<div className="space-y-2">
							<label htmlFor="titulo" className="text-sm font-semibold text-slate-700">
								Título do Comunicado
							</label>
							<input
								id="titulo"
								type="text"
								required
								className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition-all focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20"
								value={titulo}
								onChange={(e) => setTitulo(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="conteudo" className="text-sm font-semibold text-slate-700">
								Conteúdo detalhado
							</label>
							<textarea
								id="conteudo"
								required
								className="w-full min-h-[240px] rounded-lg border border-slate-300 px-4 py-3 outline-none transition-all focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20 resize-y"
								value={conteudo}
								onChange={(e) => setConteudo(e.target.value)}
							/>
						</div>
					</div>

					{/* Rodapé com botões (Excluir na esquerda, Cancelar/Salvar na direita) */}
					<div className="border-t border-slate-100 bg-slate-50 p-6 flex flex-col-reverse sm:flex-row sm:justify-between gap-4">
						<button
							type="button"
							onClick={handleExcluir}
							disabled={isDeleting || isSubmitting}
							className="px-6 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
						>
							{isDeleting ? "Excluindo..." : "Excluir Comunicado"}
						</button>

						<div className="flex flex-col sm:flex-row gap-3">
							<Link
								href="/comunicados"
								className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center text-center"
							>
								Cancelar
							</Link>
							<button
								type="submit"
								disabled={isSubmitting || isDeleting || !titulo.trim() || !conteudo.trim()}
								className="px-6 py-2.5 text-sm font-bold text-white bg-[#003882] hover:bg-[#002456] rounded-lg transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px]"
							>
								{isSubmitting ? "Salvando..." : "Salvar Alterações"}
							</button>
						</div>
					</div>

				</form>
			</div>

		</div>
	);
}