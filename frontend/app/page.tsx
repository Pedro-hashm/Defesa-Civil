"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

type Usuario = {
	id: number;
	nome: string;
	email: string;
	cargo: "ADMIN" | "ALUNO" | string;
	ativo: boolean;
	criado_em: string;
};

type LoginResponse = {
	token: string;
	expira_em: string;
	usuario: Usuario;
};

export default function Home() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [senha, setSenha] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [successData, setSuccessData] = useState<LoginResponse | null>(null);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSubmitting(true);
		setErrorMessage("");
		setSuccessData(null);

		try {
			const response = await fetch(`${API_URL}/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: email.trim().toLowerCase(),
					senha,
				}),
			});

			const data = (await response.json()) as
				| LoginResponse
				| { message?: string; error?: string };

			if (!response.ok) {
				const fallbackMessage =
					"Não foi possível entrar. Confira suas credenciais e tente novamente.";
				const errorMessage =
					(data as { message?: string; error?: string }).message ||
					(data as { message?: string; error?: string }).error ||
					fallbackMessage;
				throw new Error(errorMessage);
			}

			const loginData = data as LoginResponse;
			localStorage.setItem("defesa-civil.token", loginData.token);
			localStorage.setItem("defesa-civil.usuario", JSON.stringify(loginData.usuario));
			localStorage.setItem("defesa-civil.expira_em", loginData.expira_em);
			
			setSuccessData(loginData);
			setSenha("");

			// Aguarda 1 segundo para mostrar o feedback visual antes de redirecionar
			setTimeout(() => {
				router.push("/comunicados");
			}, 1000);

		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Ocorreu um erro inesperado ao autenticar.";
			setErrorMessage(message);
			setIsSubmitting(false); // Só volta o botão ao normal se der erro
		} 
	}

	return (
		<main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
			<section className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
				<div className="grid w-full items-center gap-8 lg:grid-cols-2">
					
					{/* Lado Esquerdo - Institucional (Azul Bandeira PE: #003882) */}
					<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#003882] to-[#002456] px-6 py-10 text-white shadow-lg sm:px-8 sm:py-12 lg:min-h-[560px] lg:p-12 border-t-4 border-t-[#003882]">
						
						{/* Detalhe de cores da bandeira PE para identidade regional */}
						<div className="absolute top-0 left-0 flex h-1.5 w-full">
							<div className="h-full w-1/4 bg-[#003882]"></div>
							<div className="h-full w-1/4 bg-white"></div>
							<div className="h-full w-1/4 bg-[#E1001A]"></div>
							<div className="h-full w-1/4 bg-[#FFD100]"></div>
							<div className="h-full w-1/4 bg-[#009B3A]"></div>
						</div>

						{/* Elementos decorativos sutis */}
						<div className="absolute right-[-60px] top-[-40px] h-40 w-40 rounded-full bg-white/5 blur-3xl" />
						<div className="absolute bottom-[-80px] left-[-20px] h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />

						<div className="relative flex h-full flex-col justify-between gap-10">
							<div className="space-y-6">
								<div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-xl font-bold backdrop-blur-sm shadow-sm">
									DC
								</div>
								<div>
									<p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">
										Governo do Estado
									</p>
									<h1 className="max-w-lg text-4xl font-bold leading-tight sm:text-5xl">
										Defesa Civil de Pernambuco
									</h1>
								</div>
								<p className="max-w-md text-base leading-relaxed text-blue-100">
									Plataforma oficial de treinamento. Acesse sua conta para continuar seus estudos, simulações e atividades de capacitação.
								</p>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:bg-white/10">
									<p className="text-sm font-semibold text-white">Aprendizado</p>
									<p className="mt-2 text-sm leading-relaxed text-blue-100">
										Conteúdos e simulações unificados em um só lugar.
									</p>
								</div>
								<div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:bg-white/10">
									<p className="text-sm font-semibold text-white">Acompanhamento</p>
									<p className="mt-2 text-sm leading-relaxed text-blue-100">
										Progresso organizado para rápido acesso institucional.
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Lado Direito - Formulário de Login */}
					<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8 lg:p-12">
						<div className="mb-8">
							<h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
								Acesso ao Portal
							</h2>
							<p className="mt-2 text-sm text-slate-500">
								Identifique-se com suas credenciais para entrar na plataforma.
							</p>
						</div>

						<form className="space-y-5" onSubmit={handleSubmit}>
							<div className="space-y-1.5">
								<label htmlFor="email" className="block text-sm font-semibold text-slate-700">
									E-mail institucional
								</label>
								<input
									id="email"
									className="h-12 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#003882] focus:bg-white focus:ring-2 focus:ring-[#003882]/20"
									type="email"
									name="email"
									autoComplete="email"
									placeholder="voce@defesacivil.pe.gov.br"
									value={email}
									onChange={(event) => setEmail(event.target.value)}
									required
								/>
							</div>

							<div className="space-y-1.5">
								<label htmlFor="senha" className="block text-sm font-semibold text-slate-700">
									Senha
								</label>
								<input
									id="senha"
									className="h-12 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#003882] focus:bg-white focus:ring-2 focus:ring-[#003882]/20"
									type="password"
									name="senha"
									autoComplete="current-password"
									placeholder="Digite sua senha"
									value={senha}
									onChange={(event) => setSenha(event.target.value)}
									required
								/>
							</div>

							{errorMessage ? (
								<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
									{errorMessage}
								</div>
							) : null}

							{successData ? (
								<div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
									Login realizado com sucesso. Redirecionando,{" "}
									<strong>{successData.usuario.nome}</strong>...
								</div>
							) : null}

							<button
								className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-[#003882] px-5 text-base font-bold text-white transition-colors hover:bg-[#002456] focus:outline-none focus:ring-2 focus:ring-[#003882] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
								type="submit"
								disabled={isSubmitting || !!successData}
							>
								{isSubmitting || !!successData ? "Autenticando..." : "Entrar no sistema"}
							</button>
						</form>
					</div>
					
				</div>
			</section>
		</main>
	);
}