"use client";

import { useState, useEffect, FormEvent } from "react";
import { API_URL } from "@/lib/api";
import { criarConvite, gerarLinkResetAdmin } from "@/services/authService";
import { validarForcaSenhaFront } from "@/lib/passwordUtils";

// --- TIPAGENS ---
type Ordem = {
	id: number;
	nome: string;
	descricao?: string;
};

type Usuario = {
	id: number;
	nome: string;
	email: string;
	cargo: "ADMIN" | "ALUNO";
	ativo: boolean;
	criado_em: string;
	ordem_id?: number | null;
	ordem?: Ordem | null;
};

type FormData = {
	nome: string;
	email: string;
	cargo: "ADMIN" | "ALUNO";
	senha?: string;
	ordem_id?: number | null;
};

type LinkModal = {
	titulo: string;
	link: string;
	expira_em: string;
} | null;

export default function UsuariosPage() {
	const [usuarios, setUsuarios] = useState<Usuario[]>([]);
	const [ordens, setOrdens] = useState<Ordem[]>([]);
	const [busca, setBusca] = useState("");
	const [filtroOrdem, setFiltroOrdem] = useState<number | "">("");
	const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [mensagem, setMensagem] = useState<{ texto: string; tipo: "sucesso" | "erro" } | null>(null);

	// Modal de link gerado
	const [linkModal, setLinkModal] = useState<LinkModal>(null);
	const [isGerandoLink, setIsGerandoLink] = useState(false);
	const [isDesbloqueando, setIsDesbloqueando] = useState(false);

	// Modal de convite
	const [showConviteModal, setShowConviteModal] = useState(false);
	const [conviteEmail, setConviteEmail] = useState("");
	const [conviteCargo, setConviteCargo] = useState<"ADMIN" | "ALUNO">("ALUNO");
	const [isGerandoConvite, setIsGerandoConvite] = useState(false);

	const [formData, setFormData] = useState<FormData>({
		nome: "",
		email: "",
		cargo: "ALUNO",
		senha: "",
		ordem_id: null,
	});
	const [senhaValidacao, setSenhaValidacao] = useState<ReturnType<typeof validarForcaSenhaFront> | null>(null);
	const [confirmarSenha, setConfirmarSenha] = useState("");

	useEffect(() => {
		carregarUsuarios();
		carregarOrdens();
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
		} catch {
			mostrarMensagem("Erro ao carregar a lista de usuários.", "erro");
		} finally {
			setIsLoading(false);
		}
	}

	async function carregarOrdens() {
		try {
			const token = localStorage.getItem("defesa-civil.token");
			const res = await fetch(`${API_URL}/ordens/ativas`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) setOrdens(await res.json());
		} catch {
			// silencia — ordens são opcionais
		}
	}

	function selecionarUsuario(usuario: Usuario) {
		setUsuarioSelecionado(usuario);
		setIsCreating(false);
		setFormData({ nome: usuario.nome, email: usuario.email, cargo: usuario.cargo, senha: "", ordem_id: usuario.ordem_id ?? null });
		setSenhaValidacao(null);
		setConfirmarSenha("");
		setMensagem(null);
	}

	function prepararCriacao() {
		setUsuarioSelecionado(null);
		setIsCreating(true);
		setFormData({ nome: "", email: "", cargo: "ALUNO", senha: "", ordem_id: null });
		setSenhaValidacao(null);
		setConfirmarSenha("");
		setMensagem(null);
	}

	function mostrarMensagem(texto: string, tipo: "sucesso" | "erro") {
		setMensagem({ texto, tipo });
		setTimeout(() => setMensagem(null), 4000);
	}

	function handleSenhaChange(valor: string) {
		setFormData((prev) => ({ ...prev, senha: valor }));
		setSenhaValidacao(valor.length > 0 ? validarForcaSenhaFront(valor) : null);
	}

	// --- AÇÕES DA API ---

	async function salvarUsuario(e: FormEvent) {
		e.preventDefault();

		// Valida senha ao criar novo usuário
		if (isCreating && formData.senha) {
			const v = validarForcaSenhaFront(formData.senha);
			if (!v.valida) {
				mostrarMensagem("Senha não atende os requisitos de segurança.", "erro");
				return;
			}
			if (formData.senha !== confirmarSenha) {
				mostrarMensagem("A confirmação de senha não confere.", "erro");
				return;
			}
		}

		setIsSaving(true);
		const token = localStorage.getItem("defesa-civil.token");
		const url = isCreating ? `${API_URL}/usuarios` : `${API_URL}/usuarios/${usuarioSelecionado?.id}`;
		const method = isCreating ? "POST" : "PUT";

		const payload: FormData = { ...formData };
		if (!isCreating && !payload.senha) delete payload.senha;

		try {
			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error("Erro ao mudar status");
			mostrarMensagem(`Usuário ${novoStatus ? "ativado" : "desativado"} com sucesso.`, "sucesso");
			setUsuarioSelecionado({ ...usuarioSelecionado, ativo: novoStatus });
			setUsuarios(usuarios.map((u) => (u.id === usuarioSelecionado.id ? { ...u, ativo: novoStatus } : u)));
		} catch {
			mostrarMensagem("Não foi possível alterar o status do usuário.", "erro");
		}
	}

	async function excluirUsuario() {
		if (!usuarioSelecionado) return;
		if (!confirm(`Tem certeza que deseja excluir o usuário ${usuarioSelecionado.nome}?`)) return;
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
		} catch {
			mostrarMensagem("Não foi possível excluir o usuário.", "erro");
		}
	}

	/** Admin gera link de reset de senha para o usuário selecionado */
	async function handleGerarLinkReset() {
		if (!usuarioSelecionado) return;
		setIsGerandoLink(true);
		try {
			const resultado = await gerarLinkResetAdmin(usuarioSelecionado.id);
			setLinkModal({
				titulo: `Link de redefinição — ${usuarioSelecionado.nome}`,
				link: resultado.link,
				expira_em: resultado.expira_em,
			});
		} catch (error: any) {
			mostrarMensagem(error.message || "Erro ao gerar link.", "erro");
		} finally {
			setIsGerandoLink(false);
		}
	}

	async function handleDesbloquear() {
		if (!usuarioSelecionado) return;
		setIsDesbloqueando(true);
		try {
			const token = localStorage.getItem("defesa-civil.token");
			const res = await fetch(`${API_URL}/usuarios/${usuarioSelecionado.id}/desbloquear`, {
				method: "PATCH",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error("Erro ao desbloquear");
			mostrarMensagem("Usuário desbloqueado com sucesso.", "sucesso");
		} catch {
			mostrarMensagem("Não foi possível desbloquear o usuário.", "erro");
		} finally {
			setIsDesbloqueando(false);
		}
	}

	/** Admin gera convite de registro */
	async function handleGerarConvite(e: FormEvent) {
		e.preventDefault();
		setIsGerandoConvite(true);
		try {
			const resultado = await criarConvite(conviteEmail || undefined, conviteCargo);
			setShowConviteModal(false);
			setConviteEmail("");
			setConviteCargo("ALUNO");
			setLinkModal({
				titulo: "Link de convite gerado",
				link: resultado.link,
				expira_em: resultado.expira_em,
			});
		} catch (error: any) {
			mostrarMensagem(error.message || "Erro ao gerar convite.", "erro");
		} finally {
			setIsGerandoConvite(false);
		}
	}

	function copiarLink(link: string) {
		navigator.clipboard.writeText(link);
	}

	const usuariosFiltrados = usuarios.filter((u) => {
		const matchBusca = u.nome.toLowerCase().includes(busca.toLowerCase());
		const matchOrdem = filtroOrdem === "" || u.ordem_id === filtroOrdem;
		return matchBusca && matchOrdem;
	});

	return (
		<div className="flex flex-col h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

			{/* Modal de link gerado */}
			{linkModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
					<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
						<h3 className="text-lg font-bold text-slate-900">{linkModal.titulo}</h3>
						<p className="mt-1 text-xs text-slate-500">
							Expira em: {new Date(linkModal.expira_em).toLocaleString("pt-BR")}
						</p>
						<div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
							<p className="flex-1 truncate text-xs font-mono text-slate-700">{linkModal.link}</p>
							<button
								onClick={() => copiarLink(linkModal.link)}
								className="shrink-0 rounded-md bg-[#003882] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#002456]"
							>
								Copiar
							</button>
						</div>
						<p className="mt-3 text-xs text-slate-400">
							Envie este link diretamente ao usuário. Ele é de uso único e expira automaticamente.
						</p>
						<button
							onClick={() => setLinkModal(null)}
							className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
						>
							Fechar
						</button>
					</div>
				</div>
			)}

			{/* Modal de novo convite */}
			{showConviteModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
					<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
						<h3 className="text-lg font-bold text-slate-900">Gerar convite de cadastro</h3>
						<p className="mt-1 text-sm text-slate-500">
							O link gerado permite que uma pessoa crie a própria conta. Expira em 48h.
						</p>
						<form onSubmit={handleGerarConvite} className="mt-5 space-y-4">
							<div className="space-y-1.5">
								<label className="text-sm font-semibold text-slate-700">
									E-mail (opcional — restringe o convite a este e-mail)
								</label>
								<input
									type="email"
									value={conviteEmail}
									onChange={(e) => setConviteEmail(e.target.value)}
									placeholder="pessoa@defesacivil.pe.gov.br"
									className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20"
								/>
							</div>
							<div className="space-y-1.5">
								<label className="text-sm font-semibold text-slate-700">Cargo</label>
								<select
									value={conviteCargo}
									onChange={(e) => setConviteCargo(e.target.value as "ADMIN" | "ALUNO")}
									className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20"
								>
									<option value="ALUNO">Aluno (Padrão)</option>
									<option value="ADMIN">Administrador</option>
								</select>
							</div>
							<div className="flex gap-3 pt-2">
								<button
									type="button"
									onClick={() => setShowConviteModal(false)}
									className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={isGerandoConvite}
									className="flex-1 rounded-lg bg-[#003882] py-2.5 text-sm font-bold text-white hover:bg-[#002456] disabled:opacity-70"
								>
									{isGerandoConvite ? "Gerando..." : "Gerar link"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Usuários</h1>
					<p className="mt-1 text-base text-slate-500">Controle de acessos, cadastros e permissões da plataforma.</p>
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => setShowConviteModal(true)}
						className="inline-flex items-center gap-2 rounded-lg border border-[#003882] px-4 py-2.5 text-sm font-bold text-[#003882] transition hover:bg-[#003882]/5"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
						</svg>
						Gerar Convite
					</button>
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
			</div>

			<div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-12rem)] lg:min-h-[500px]">

				{/* LISTA */}
				<div className="w-full lg:w-1/3 flex flex-col h-[450px] lg:h-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden shrink-0">
					<div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex flex-col gap-3">
						<h2 className="font-semibold text-slate-700">Usuários Cadastrados</h2>
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
						{ordens.length > 0 && (
							<select
								value={filtroOrdem}
								onChange={(e) => setFiltroOrdem(e.target.value === "" ? "" : Number(e.target.value))}
								className="w-full py-2 px-3 text-sm rounded-lg border border-slate-300 bg-white outline-none focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20"
							>
								<option value="">Todas as ordens</option>
								{ordens.map((o) => (
									<option key={o.id} value={o.id}>{o.nome}</option>
								))}
							</select>
						)}
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
									className={`w-full cursor-pointer flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
										usuarioSelecionado?.id === u.id
											? "bg-blue-50 border border-blue-200"
											: "hover:bg-slate-50 border border-transparent"
									}`}
								>
									<div className="overflow-hidden">
										<div className="flex items-center gap-2">
											<p className="font-medium text-slate-900 truncate">{u.nome}</p>
											{!u.ativo && <span className="shrink-0 h-2 w-2 rounded-full bg-red-500" title="Inativo" />}
										</div>
										<p className="text-xs text-slate-500 truncate">{u.email}</p>
										{u.ordem && (
											<p className="text-xs text-indigo-600 truncate mt-0.5">⚜ {u.ordem.nome}</p>
										)}
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

				{/* FORMULÁRIO */}
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
							<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4 shrink-0">
								<h2 className="font-semibold text-slate-800">
									{isCreating ? "Novo Usuário" : "Detalhes do Usuário"}
								</h2>
								{!isCreating && usuarioSelecionado && (
									<div className="flex flex-wrap gap-2">
										<button
											type="button"
											onClick={handleGerarLinkReset}
											disabled={isGerandoLink}
											className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-60"
										>
											{isGerandoLink ? "Gerando..." : "Link de Reset"}
										</button>
										<button
											type="button"
											onClick={handleDesbloquear}
											disabled={isDesbloqueando}
											className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors disabled:opacity-60"
										>
											{isDesbloqueando ? "Desbloqueando..." : "Desbloquear"}
										</button>
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

							<form onSubmit={salvarUsuario} className="flex-1 overflow-y-auto p-6 flex flex-col">
								{mensagem && (
									<div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
										mensagem.tipo === "sucesso"
											? "bg-emerald-50 text-emerald-800 border border-emerald-200"
											: "bg-red-50 text-red-800 border border-red-200"
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
										<label className="text-sm font-semibold text-slate-700">Ordem</label>
										<select
											className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/20 bg-white"
											value={formData.ordem_id ?? ""}
											onChange={(e) => setFormData({ ...formData, ordem_id: e.target.value === "" ? null : Number(e.target.value) })}
										>
											<option value="">— Sem ordem —</option>
											{ordens.map((o) => (
												<option key={o.id} value={o.id}>{o.nome}</option>
											))}
										</select>
										{ordens.length === 0 && (
											<p className="text-xs text-slate-400">Nenhuma ordem cadastrada ainda.</p>
										)}
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
											onChange={(e) => handleSenhaChange(e.target.value)}
										/>
										{/* Requisitos inline */}
										{senhaValidacao && formData.senha && formData.senha.length > 0 && (
											<ul className="space-y-0.5 text-xs">
												{[
													{ ok: senhaValidacao.regras.minimo8, label: "8+ caracteres" },
													{ ok: senhaValidacao.regras.maiuscula, label: "Maiúscula" },
													{ ok: senhaValidacao.regras.minuscula, label: "Minúscula" },
													{ ok: senhaValidacao.regras.numero, label: "Número" },
													{ ok: senhaValidacao.regras.especial, label: "Especial (@#$!...)" },
												].map(({ ok, label }) => (
													<li key={label} className={`flex items-center gap-1 ${ok ? "text-emerald-600" : "text-slate-400"}`}>
														<span>{ok ? "✓" : "○"}</span> {label}
													</li>
												))}
											</ul>
										)}
									</div>

									{/* Confirmar senha — só exibe ao criar novo usuário */}
									{isCreating && (
										<div className="space-y-2">
											<label className="text-sm font-semibold text-slate-700">
												Confirmar senha
											</label>
											<input
												type="password"
												required
												placeholder="Repita a senha"
												className={`w-full rounded-lg border px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#003882]/20 ${
													confirmarSenha.length > 0
														? confirmarSenha === formData.senha
															? "border-emerald-500 focus:border-emerald-500"
															: "border-red-400 focus:border-red-400"
														: "border-slate-300 focus:border-[#003882]"
												}`}
												value={confirmarSenha}
												onChange={(e) => setConfirmarSenha(e.target.value)}
											/>
											{confirmarSenha.length > 0 && confirmarSenha !== formData.senha && (
												<p className="text-xs text-red-500">As senhas não conferem.</p>
											)}
											{confirmarSenha.length > 0 && confirmarSenha === formData.senha && (
												<p className="text-xs text-emerald-600">✓ Senhas conferem.</p>
											)}
										</div>
									)}
								</div>

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
