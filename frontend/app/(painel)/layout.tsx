"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function PainelLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter(); 
	
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [cargo, setCargo] = useState<string | null>(null);

	// Lê os dados do usuário do localStorage apenas no lado do cliente
	useEffect(() => {
		const usuarioStorage = localStorage.getItem("defesa-civil.usuario");
		if (usuarioStorage) {
			try {
				const usuario = JSON.parse(usuarioStorage);
				setCargo(usuario.cargo);
			} catch (error) {
				console.error("Erro ao processar dados do usuário", error);
			}
		}
	}, []);

	const isActive = (path: string) => pathname.startsWith(path);
	const isAdmin = cargo === "ADMIN";

	const handleLogout = () => {
		localStorage.removeItem("defesa-civil.token");
		localStorage.removeItem("defesa-civil.usuario");
		localStorage.removeItem("defesa-civil.expira_em");
		router.push("/");
	};

	const NavLinks = () => (
		<>
			<Link
				href="/comunicados"
				onClick={() => setIsMobileMenuOpen(false)}
				className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors !no-underline ${
					isActive("/comunicados") && !isActive("/comunicados/criar")
						? "bg-white/20 !text-white shadow-sm border border-white/20"
						: "!text-slate-300 hover:bg-white/10 hover:!text-white"
				}`}
			>
				<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
				</svg>
				Comunicados
			</Link>
			
			<Link
				href="/simulador"
				onClick={() => setIsMobileMenuOpen(false)}
				className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors !no-underline ${
					isActive("/simulador")
						? "bg-white/20 !text-white shadow-sm border border-white/20"
						: "!text-slate-300 hover:bg-white/10 hover:!text-white"
				}`}
			>
				<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				Simulador de Ocorrências
			</Link>

			{/* LINKS EXCLUSIVOS PARA ADMINISTRADORES */}
			{isAdmin && (
				<>
					<div className="pt-4 pb-1">
						<p className="px-4 text-xs font-bold uppercase tracking-wider text-blue-300/70">
							Administração
						</p>
					</div>

					<Link
						href="/comunicados/criar"
						onClick={() => setIsMobileMenuOpen(false)}
						className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors !no-underline ${
							isActive("/comunicados/criar")
								? "bg-white/20 !text-white shadow-sm border border-white/20"
								: "!text-slate-300 hover:bg-white/10 hover:!text-white"
						}`}
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
						Novo Comunicado
					</Link>

					<Link
						href="/usuarios"
						onClick={() => setIsMobileMenuOpen(false)}
						className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors !no-underline ${
							isActive("/usuarios")
								? "bg-white/20 !text-white shadow-sm border border-white/20"
								: "!text-slate-300 hover:bg-white/10 hover:!text-white"
						}`}
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
						</svg>
						Gestão de Usuários
					</Link>

					<Link
						href="/ordens"
						onClick={() => setIsMobileMenuOpen(false)}
						className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors !no-underline ${
							isActive("/ordens")
								? "bg-white/20 !text-white shadow-sm border border-white/20"
								: "!text-slate-300 hover:bg-white/10 hover:!text-white"
						}`}
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
						</svg>
						Gestão de Ordens
					</Link>
				</>
			)}
		</>
	);

	return (
		<div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden">
			
			{/* SIDEBAR DESKTOP */}
			<aside className="hidden w-72 flex-col bg-gradient-to-b from-[#003882] to-[#002456] text-white lg:flex relative border-r border-[#002456] h-full shrink-0">
				
				<div className="absolute top-0 left-0 flex h-1 w-full">
					<div className="h-full w-1/4 bg-[#003882]"></div>
					<div className="h-full w-1/4 bg-white"></div>
					<div className="h-full w-1/4 bg-[#E1001A]"></div>
					<div className="h-full w-1/4 bg-[#FFD100]"></div>
					<div className="h-full w-1/4 bg-[#009B3A]"></div>
				</div>

				<div className="flex items-center gap-4 p-8 shrink-0">
					<div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm shadow-sm overflow-hidden">
						<Image src="/img/logo-defesa-civil.jpg" alt="Logo Defesa Civil" width={48} height={48} className="h-full w-full object-contain" />
					</div>
					<div>
						<h2 className="text-lg font-bold leading-tight !text-white">Defesa Civil</h2>
						<p className="text-xs !text-blue-200">Plataforma de Treinamento</p>
					</div>
				</div>

				<nav className="flex-1 space-y-2 px-4 overflow-y-auto">
					<NavLinks />
				</nav>

				{/* BOTÃO DE LOGOUT - DESKTOP */}
				<div className="border-t border-white/10 p-4 shrink-0">
					<button 
						onClick={handleLogout}
						className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium !text-blue-200 transition-colors hover:bg-white/5 hover:!text-white"
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
						</svg>
						Sair do sistema
					</button>
				</div>
			</aside>

			{/* OVERLAY E MENU MOBILE */}
			{isMobileMenuOpen && (
				<div className="fixed inset-0 z-[90] lg:hidden">
					<div 
						className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
						onClick={() => setIsMobileMenuOpen(false)}
					/>
					
					<div className="absolute top-0 left-0 bottom-0 w-3/4 max-w-sm bg-gradient-to-b from-[#003882] to-[#002456] shadow-2xl animate-in slide-in-from-left-full duration-300 flex flex-col h-full">
						<div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
							<span className="font-bold text-lg !text-white">Menu</span>
							<button onClick={() => setIsMobileMenuOpen(false)} className="!text-white p-2">
								<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						
						<nav className="flex-1 space-y-2 p-4 overflow-y-auto">
							<NavLinks />
						</nav>

						<div className="border-t border-white/10 p-4 shrink-0">
							<button 
								onClick={handleLogout}
								className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium !text-blue-200 transition-colors hover:bg-white/5 hover:!text-white"
							>
								<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
								</svg>
								Sair do sistema
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ÁREA DE CONTEÚDO PRINCIPAL */}
			<main className="flex flex-1 flex-col h-full relative">
				
				{/* HEADER MOBILE TRAVADO */}
				<header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden shrink-0 z-[50]">
					<div className="flex items-center gap-2 font-bold text-[#003882]">
						<div className="flex h-8 w-8 items-center justify-center rounded bg-[#003882] overflow-hidden">
							<Image src="/img/logo-defesa-civil.jpg" alt="Logo Defesa Civil" width={32} height={32} className="h-full w-full object-contain" />
						</div>
						Defesa Civil
					</div>
					
					<button 
						type="button"
						onClick={() => setIsMobileMenuOpen(true)}
						className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
					>
						<span className="sr-only">Abrir menu</span>
						<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>
				</header>

				<div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10">
					<div className="mx-auto max-w-5xl pb-10">
						{children}
					</div>
				</div>
			</main>

		</div>
	);
}