"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";

export default function CriarComunicadoPage() {
	const router = useRouter();
	const [titulo, setTitulo] = useState("");
	const [conteudo, setConteudo] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [mensagem, setMensagem] = useState<{ texto: string; tipo: "sucesso" | "erro" } | null>(null);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setIsSubmitting(true);
		setMensagem(null);

		const token = localStorage.getItem("defesa-civil.token");

		try {
			const res = await fetch(`${API_URL}/comunicados`, {
				method: "POST",
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
				throw new Error(errorData.error || "Erro ao criar comunicado.");
			}

			setMensagem({ texto: "Comunicado publicado com sucesso! Redirecionando...", tipo: "sucesso" });
			
			// Aguarda um pouquinho para o usuário ler a mensagem de sucesso
			setTimeout(() => {
				router.push("/comunicados");
			}, 1500);

		} catch (error: any) {
			setMensagem({ texto: error.message, tipo: "erro" });
			setIsSubmitting(false);
		}
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
				<h1 className="text-3xl font-bold tracking-tight text-slate-900">Novo Comunicado</h1>
				<p className="text-base text-slate-500">Crie um aviso que será exibido para todos os usuários da plataforma.</p>
			</div>

			{/* Formulário (Card) */}
			<div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
				<form onSubmit={handleSubmit} className="flex flex-col">
					
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
								placeholder="Ex: Atualização no protocolo de vistorias"
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
								placeholder="Escreva os detalhes do comunicado aqui..."
								className="w-full min-h-[240px] rounded-lg border border-slate-300 px-4 py-3 outline-none transition-all focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20 resize-y"
								value={conteudo}
								onChange={(e) => setConteudo(e.target.value)}
							/>
							<p className="text-xs text-slate-500 text-right">
								Este texto será visível para Administradores e Alunos.
							</p>
						</div>
					</div>

					{/* Rodapé com botões */}
					<div className="border-t border-slate-100 bg-slate-50 p-6 flex justify-end gap-3">
						<Link
							href="/comunicados"
							className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center"
						>
							Cancelar
						</Link>
						<button
							type="submit"
							disabled={isSubmitting || !titulo.trim() || !conteudo.trim()}
							className="px-6 py-2.5 text-sm font-bold text-white bg-[#003882] hover:bg-[#002456] rounded-lg transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
						>
							{isSubmitting ? "Publicando..." : "Publicar Comunicado"}
						</button>
					</div>

				</form>
			</div>

		</div>
	);
}