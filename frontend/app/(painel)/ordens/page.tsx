"use client";

import { useState, useEffect, FormEvent } from "react";
import { API_URL } from "@/lib/api";

type Ordem = {
	id: number;
	nome: string;
	descricao?: string;
	ativo: boolean;
	criado_em: string;
};

export default function OrdensPage() {
	const [ordens, setOrdens] = useState<Ordem[]>([]);
	const [ordemSelecionada, setOrdemSelecionada] = useState<Ordem | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [mensagem, setMensagem] = useState<{ texto: string; tipo: "sucesso" | "erro" } | null>(null);
	const [busca, setBusca] = useState("");

	const [formData, setFormData] = useState<{ nome: string; descricao: string }>({
		nome: "",
		descricao: "",
	});

	useEffect(() => {
		carregarOrdens();
	}, []);

	async function carregarOrdens() {
		setIsLoading(true);
		try {
			const token = localStorage.getItem("defesa-civil.token");
			const res = await fetch(`${API_URL}/ordens`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error();
			setOrdens(await res.json());
		} catch {
			mostrarMensagem("Erro ao carregar ordens.", "erro");
		} finally {
			setIsLoading(false);
		}
	}

	function mostrarMensagem(texto: string, tipo: "sucesso" | "erro") {
		setMensagem({ texto, tipo });
		setTimeout(() => setMensagem(null), 4000);
	}

	function selecionarOrdem(ordem: Ordem) {
		setOrdemSelecionada(ordem);
		setIsCreating(false);
		setFormData({ nome: ordem.nome, descricao: ordem.descricao ?? "" });
		setMensagem(null);
	}

	function prepararCriacao() {
		setOrdemSelecionada(null);
		setIsCreating(true);
		setFormData({ nome: "", descricao: "" });
		setMensagem(null);
	}

	async function salvarOrdem(e: FormEvent) {
		e.preventDefault();
		if (!formData.nome.trim()) {
			mostrarMensagem("O nome da ordem é obrigatório.", "erro");
			return;
		}
		setIsSaving(true);
		const token = localStorage.getItem("defesa-civil.token");
		const url = isCreating ? `${API_URL}/ordens` : `${API_URL}/ordens/${ordemSelecionada?.id}`;
		const method = isCreating ? "POST" : "PUT";

		try {
			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					nome: formData.nome.trim(),
					descricao: formData.descricao.trim() || undefined,
				}),
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Erro ao salvar ordem.");
			}
			mostrarMensagem(isCreating ? "Ordem criada com sucesso!" : "Ordem atualizada!", "sucesso");
			carregarOrdens();
			if (isCreating) {
				setIsCreating(false);
				setOrdemSelecionada(null);
			}
		} catch (error: any) {
			mostrarMensagem(error.message, "erro");
		} finally {
			setIsSaving(false);
		}
	}

	async function alternarStatus() {
		if (!ordemSelecionada) return;
		const token = localStorage.getItem("defesa-civil.token");
		const novoAtivo = !ordemSelecionada.ativo;
		try {
			const res = await fetch(`${API_URL}/ordens/${ordemSelecionada.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ ativo: novoAtivo }),
			});
			if (!res.ok) throw new Error();
			mostrarMensagem(`Ordem ${novoAtivo ? "ativada" : "desativada"} com sucesso.`, "sucesso");
			setOrdemSelecionada({ ...ordemSelecionada, ativo: novoAtivo });
			setOrdens(ordens.map((o) => (o.id === ordemSelecionada.id ? { ...o, ativo: novoAtivo } : o)));
		} catch {
			mostrarMensagem("Não foi possível alterar o status.", "erro");
		}
	}

	async function excluirOrdem() {
		if (!ordemSelecionada) return;
		if (!confirm(`Excluir a ordem "${ordemSelecionada.nome}"? Usuários vinculados perderão a associação.`)) return;
		const token = localStorage.getItem("defesa-civil.token");
		try {
			const res = await fetch(`${API_URL}/ordens/${ordemSelecionada.id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error();
			mostrarMensagem("Ordem excluída.", "sucesso");
			setOrdemSelecionada(null);
			carregarOrdens();
		} catch {
			mostrarMensagem("Não foi possível excluir a ordem.", "erro");
		}
	}

	const ordensFiltradas = ordens.filter((o) =>
		o.nome.toLowerCase().includes(busca.toLowerCase())
	);

	return (
		<div className="flex flex-col h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Ordens</h1>
					<p className="mt-1 text-base text-slate-500">Cadastre e gerencie as ordens disponíveis para os usuários.</p>
				</div>
				<button
					onClick={prepararCriacao}
					className="inline-flex items-center gap-2 rounded-lg bg-[#003882] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#002456] shadow-sm"
				>
					<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
					</svg>
					Nova Ordem
				</button>
			</div>

			<div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-12rem)] lg:min-h-[500px]">

				{/* LISTA */}
				<div className="w-full lg:w-1/3 flex flex-col h-[400px] lg:h-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden shrink-0">
					<div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex flex-col gap-3">
						<h2 className="font-semibold text-slate-700">Ordens Cadastradas</h2>
						<div className="relative">
							<svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
							<input
								type="text"
								placeholder="Buscar por nome..."
								value={busca}
								onChange={(e) => setBusca(e.target.value)}
								className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 outline-none transition-all focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20"
							/>
						</div>
					</div>
					<div className="flex-1 overflow-y-auto p-2 space-y-1">
						{isLoading ? (
							<div className="p-4 text-center text-sm text-slate-500">Carregando...</div>
						) : ordensFiltradas.length === 0 ? (
							<div className="p-4 text-center text-sm text-slate-500">
								{ordens.length === 0 ? "Nenhuma ordem cadastrada." : "Nenhuma ordem corresponde à busca."}
							</div>
						) : (
							ordensFiltradas.map((o) => (
								<button
									key={o.id}
									onClick={() => selecionarOrdem(o)}
									className={`w-full cursor-pointer flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
										ordemSelecionada?.id === o.id
											? "bg-blue-50 border border-blue-200"
											: "hover:bg-slate-50 border border-transparent"
									}`}
								>
									<div className="overflow-hidden">
										<div className="flex items-center gap-2">
											<span className="text-indigo-500">⚜</span>
											<p className="font-medium text-slate-900 truncate">{o.nome}</p>
											{!o.ativo && <span className="shrink-0 h-2 w-2 rounded-full bg-red-500" title="Inativa" />}
										</div>
										{o.descricao && (
											<p className="text-xs text-slate-500 truncate mt-0.5 ml-5">{o.descricao}</p>
										)}
									</div>
									<span className={`shrink-0 ml-2 text-xs font-bold px-2 py-1 rounded-full ${
										o.ativo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
									}`}>
										{o.ativo ? "Ativa" : "Inativa"}
									</span>
								</button>
							))
						)}
					</div>
				</div>

				{/* FORMULÁRIO */}
				<div className="w-full lg:w-2/3 flex flex-col min-h-[400px] lg:min-h-0 lg:h-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
					{!ordemSelecionada && !isCreating ? (
						<div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
							<span className="text-6xl mb-4 opacity-30">⚜</span>
							<p>Selecione uma ordem na lista ou crie uma nova.</p>
						</div>
					) : (
						<div className="flex flex-col h-full">
							<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4 shrink-0">
								<h2 className="font-semibold text-slate-800">
									{isCreating ? "Nova Ordem" : "Detalhes da Ordem"}
								</h2>
								{!isCreating && ordemSelecionada && (
									<div className="flex gap-2">
										<button
											type="button"
											onClick={alternarStatus}
											className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
												ordemSelecionada.ativo
													? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
													: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
											}`}
										>
											{ordemSelecionada.ativo ? "Desativar" : "Reativar"}
										</button>
										<button
											type="button"
											onClick={excluirOrdem}
											className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
										>
											Excluir
										</button>
									</div>
								)}
							</div>

							<form onSubmit={salvarOrdem} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
								{mensagem && (
									<div className={`p-4 rounded-lg text-sm font-medium ${
										mensagem.tipo === "sucesso"
											? "bg-emerald-50 text-emerald-800 border border-emerald-200"
											: "bg-red-50 text-red-800 border border-red-200"
									}`}>
										{mensagem.texto}
									</div>
								)}

								<div className="space-y-2">
									<label className="text-sm font-semibold text-slate-700">
										Nome da ordem <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										required
										placeholder="Ex: Ordem dos Bombeiros, Ordem Civil..."
										className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20"
										value={formData.nome}
										onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
									/>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-semibold text-slate-700">Descrição (opcional)</label>
									<textarea
										rows={4}
										placeholder="Descreva brevemente a finalidade desta ordem..."
										className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20 resize-none"
										value={formData.descricao}
										onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
									/>
								</div>

								<div className="mt-auto flex justify-end gap-3">
									<button
										type="button"
										onClick={() => { setOrdemSelecionada(null); setIsCreating(false); setMensagem(null); }}
										className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
									>
										Cancelar
									</button>
									<button
										type="submit"
										disabled={isSaving}
										className="px-6 py-2.5 text-sm font-bold text-white bg-[#003882] hover:bg-[#002456] rounded-lg transition-colors shadow-sm disabled:opacity-70"
									>
										{isSaving ? "Salvando..." : "Salvar Ordem"}
									</button>
								</div>
							</form>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
