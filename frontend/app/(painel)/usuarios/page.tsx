"use client";

import { useState, useEffect, FormEvent } from "react";
import { API_URL } from "@/lib/api";

// --- TIPAGENS ---
type Usuario = {
	id: number;
	nome: string;
	email: string;
	cargo: "ADMIN" | "ALUNO";
	ativo: boolean;
	criado_em: string;
};

type FormData = {
	nome: string;
	email: string;
	cargo: "ADMIN" | "ALUNO";
	senha?: string;
};

export default function UsuariosPage() {
	const [usuarios, setUsuarios] = useState<Usuario[]>([]);
	const [busca, setBusca] = useState(""); // Novo estado para a busca
	const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [mensagem, setMensagem] = useState<{ texto: string; tipo: "sucesso" | "erro" } | null>(null);

	// Dados do formulário
	const [formData, setFormData] = useState<FormData>({
		nome: "",
		email: "",
		cargo: "ALUNO",
		senha: "",
	});

	// Busca os usuários ao carregar a página
	useEffect(() => {
		carregarUsuarios();
	}, []);

	async function carregarUsuarios() {
		setIsLoading(true);
		try {
			const token = localStorage.getItem("defesa-civil.token");
			const res = await fetch(`${API_URL}/usuarios`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error("Falha ao carregar usuários");
			const data = await res.json();
			setUsuarios(data);
		} catch (error) {
			mostrarMensagem("Erro ao carregar a lista de usuários.", "erro");
		} finally {
			setIsLoading(false);
		}
	}

	function selecionarUsuario(usuario: Usuario) {
		setUsuarioSelecionado(usuario);
		setIsCreating(false);
		setFormData({
			nome: usuario.nome,
			email: usuario.email,
			cargo: usuario.cargo,
			senha: "", // Senha vazia ao editar, só preenche se quiser mudar
		});
		setMensagem(null);
	}

	function prepararCriacao() {
		setUsuarioSelecionado(null);
		setIsCreating(true);
		setFormData({ nome: "", email: "", cargo: "ALUNO", senha: "" });
		setMensagem(null);
	}

	function mostrarMensagem(texto: string, tipo: "sucesso" | "erro") {
		setMensagem({ texto, tipo });
		setTimeout(() => setMensagem(null), 4000);
	}

	// --- AÇÕES DA API ---

	async function salvarUsuario(e: FormEvent) {
		e.preventDefault();
		setIsSaving(true);
		
		const token = localStorage.getItem("defesa-civil.token");
		const url = isCreating ? `${API_URL}/usuarios` : `${API_URL}/usuarios/${usuarioSelecionado?.id}`;
		const method = isCreating ? "POST" : "PUT";

		// Se estiver editando e a senha estiver vazia, removemos do payload para não dar erro
		const payload: any = { ...formData };
		if (!isCreating && !payload.senha) {
			delete payload.senha;
		}

		try {
			const res = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || "Erro ao salvar usuário.");
			}

			mostrarMensagem(isCreating ? "Usuário criado com sucesso!" : "Usuário atualizado!", "sucesso");
			carregarUsuarios();
			if (isCreating) setIsCreating(false);
		} catch (error: any) {
			mostrarMensagem(error.message, "erro");
		} finally {
			setIsSaving(false);
		}
	}

	async function alternarStatus() {
		if (!usuarioSelecionado) return;
		const token = localStorage.getItem("defesa-civil.token");
		const novoStatus = !usuarioSelecionado.ativo;

		const acao = novoStatus ? "ativar" : "desativar";

		try {
			const res = await fetch(`${API_URL}/usuarios/${usuarioSelecionado.id}/${acao}`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!res.ok) throw new Error("Erro ao mudar status");

			mostrarMensagem(`Usuário ${novoStatus ? "ativado" : "desativado"} com sucesso.`, "sucesso");
			
			setUsuarioSelecionado({ ...usuarioSelecionado, ativo: novoStatus });
			setUsuarios(usuarios.map(u => u.id === usuarioSelecionado.id ? { ...u, ativo: novoStatus } : u));
		} catch (error) {
			mostrarMensagem("Não foi possível alterar o status do usuário.", "erro");
		}
	}

	async function excluirUsuario() {
		if (!usuarioSelecionado) return;
		if (!confirm(`Tem certeza que deseja excluir o usuário ${usuarioSelecionado.nome}? Esta ação não pode ser desfeita.`)) return;

		const token = localStorage.getItem("defesa-civil.token");

		try {
			const res = await fetch(`${API_URL}/usuarios/${usuarioSelecionado.id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!res.ok) throw new Error("Erro ao excluir");

			mostrarMensagem("Usuário excluído definitivamente.", "sucesso");
			setUsuarioSelecionado(null);
			carregarUsuarios();
		} catch (error) {
			mostrarMensagem("Não foi possível excluir o usuário.", "erro");
		}
	}

	// Filtra os usuários com base no termo de busca
	const usuariosFiltrados = usuarios.filter((u) => 
		u.nome.toLowerCase().includes(busca.toLowerCase())
	);

	// --- RENDERIZAÇÃO ---

	return (
		<div className="flex flex-col h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Usuários</h1>
					<p className="mt-1 text-base text-slate-500">Controle de acessos, cadastros e permissões da plataforma.</p>
				</div>
				<button
					onClick={prepararCriacao}
					className="inline-flex items-center gap-2 rounded-lg bg-[#003882] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#002456] shadow-sm"
				>
					<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
					</svg>
					Novo Usuário
				</button>
			</div>

			{/* Layout Split: Lista + Formulário. Adicionado lg: prefixos para que no mobile fiquem empilhados e com alturas boas */}
			<div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-12rem)] lg:min-h-[500px]">
				
				{/* LADO ESQUERDO: LISTA DE USUÁRIOS (Aumentado para h-[450px] no mobile) */}
				<div className="w-full lg:w-1/3 flex flex-col h-[450px] lg:h-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden shrink-0">
					<div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex flex-col gap-3">
						<h2 className="font-semibold text-slate-700">Usuários Cadastrados</h2>
						
						{/* Campo de Busca */}
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
							<div className="p-4 text-center text-sm text-slate-500">Carregando usuários...</div>
						) : usuariosFiltrados.length === 0 ? (
							<div className="p-4 text-center text-sm text-slate-500">
								{usuarios.length === 0 ? "Nenhum usuário encontrado." : "Nenhum usuário corresponde à busca."}
							</div>
						) : (
							usuariosFiltrados.map((u) => (
								<button
									key={u.id}
									onClick={() => selecionarUsuario(u)}
									className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
										usuarioSelecionado?.id === u.id
											? "bg-blue-50 border border-blue-200"
											: "hover:bg-slate-50 border border-transparent"
									}`}
								>
									<div className="overflow-hidden">
										<div className="flex items-center gap-2">
											<p className="font-medium text-slate-900 truncate">{u.nome}</p>
											{!u.ativo && (
												<span className="shrink-0 h-2 w-2 rounded-full bg-red-500" title="Inativo" />
											)}
										</div>
										<p className="text-xs text-slate-500 truncate">{u.email}</p>
									</div>
									<span className={`shrink-0 ml-2 text-xs font-bold px-2 py-1 rounded-full ${
										u.cargo === "ADMIN" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
									}`}>
										{u.cargo}
									</span>
								</button>
							))
						)}
					</div>
				</div>

				{/* LADO DIREITO: FORMULÁRIO DE EDIÇÃO/CRIAÇÃO */}
				<div className="w-full lg:w-2/3 flex flex-col min-h-[500px] lg:min-h-0 lg:h-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
					{!usuarioSelecionado && !isCreating ? (
						<div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
							<svg className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
							<p>Selecione um usuário na lista ou crie um novo.</p>
						</div>
					) : (
						<div className="flex flex-col h-full">
							{/* Header do Form */}
							<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4 shrink-0">
								<h2 className="font-semibold text-slate-800">
									{isCreating ? "Novo Usuário" : "Detalhes do Usuário"}
								</h2>
								{!isCreating && usuarioSelecionado && (
									<div className="flex gap-2">
										<button
											type="button"
											onClick={alternarStatus}
											className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
												usuarioSelecionado.ativo 
													? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" 
													: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
											}`}
										>
											{usuarioSelecionado.ativo ? "Desativar Acesso" : "Reativar Acesso"}
										</button>
										<button
											type="button"
											onClick={excluirUsuario}
											className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
										>
											Excluir
										</button>
									</div>
								)}
							</div>

							{/* Corpo do Form */}
							<form onSubmit={salvarUsuario} className="flex-1 overflow-y-auto p-6 flex flex-col">
								
								{mensagem && (
									<div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
										mensagem.tipo === "sucesso" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
									}`}>
										{mensagem.texto}
									</div>
								)}

								<div className="grid gap-6 sm:grid-cols-2">
									<div className="space-y-2">
										<label className="text-sm font-semibold text-slate-700">Nome completo</label>
										<input
											type="text"
											required
											className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20"
											value={formData.nome}
											onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
										/>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-semibold text-slate-700">E-mail</label>
										<input
											type="email"
											required
											className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20"
											value={formData.email}
											onChange={(e) => setFormData({ ...formData, email: e.target.value })}
										/>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-semibold text-slate-700">Cargo no sistema</label>
										<select
											className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20 bg-white"
											value={formData.cargo}
											onChange={(e) => setFormData({ ...formData, cargo: e.target.value as "ADMIN" | "ALUNO" })}
										>
											<option value="ALUNO">Aluno (Padrão)</option>
											<option value="ADMIN">Administrador</option>
										</select>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-semibold text-slate-700">
											{isCreating ? "Senha de acesso" : "Nova senha (opcional)"}
										</label>
										<input
											type="password"
											required={isCreating}
											placeholder={isCreating ? "Crie uma senha forte" : "Deixe em branco para não alterar"}
											className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20"
											value={formData.senha}
											onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
										/>
									</div>
								</div>

								{/* Footer do Form com Botões de Salvar */}
								<div className="mt-auto pt-8 flex justify-end gap-3">
									<button
										type="button"
										onClick={() => { setUsuarioSelecionado(null); setIsCreating(false); setMensagem(null); }}
										className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
									>
										Cancelar
									</button>
									<button
										type="submit"
										disabled={isSaving}
										className="px-6 py-2.5 text-sm font-bold text-white bg-[#003882] hover:bg-[#002456] rounded-lg transition-colors shadow-sm disabled:opacity-70"
									>
										{isSaving ? "Salvando..." : "Salvar Dados"}
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