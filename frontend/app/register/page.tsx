"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  validarConvite,
  registrarComConvite,
  type ConviteInfo,
} from "../../services/authService";
import {
  validarForcaSenhaFront,
  type ValidacaoSenhaFront,
} from "../../lib/passwordUtils";

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token")?.trim() ?? "";

  const [conviteInfo, setConviteInfo] = useState<ConviteInfo | null>(null);
  const [conviteErro, setConviteErro] = useState("");
  const [isValidandoToken, setIsValidandoToken] = useState(true);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [validacao, setValidacao] = useState<ValidacaoSenhaFront | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setConviteErro("Link de convite inválido. Solicite um novo ao administrador.");
      setIsValidandoToken(false);
      return;
    }

    validarConvite(token)
      .then((info) => {
        setConviteInfo(info);
        if (info.email) setEmail(info.email);
      })
      .catch(() => {
        setConviteErro("Este convite é inválido ou já expirou. Solicite um novo ao administrador.");
      })
      .finally(() => setIsValidandoToken(false));
  }, [token]);

  function handleSenhaChange(valor: string) {
    setSenha(valor);
    setValidacao(validarForcaSenhaFront(valor));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!validacao?.valida) {
      setErrorMessage("A senha não atende os requisitos de segurança.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErrorMessage("As senhas não conferem.");
      return;
    }

    setIsSubmitting(true);
    try {
      const loginData = await registrarComConvite(token, nome, email, senha);
      localStorage.setItem("defesa-civil.token", loginData.token);
      localStorage.setItem("defesa-civil.usuario", JSON.stringify(loginData.usuario));
      localStorage.setItem("defesa-civil.expira_em", loginData.expira_em);
      setSuccessMessage("Conta criada com sucesso! Redirecionando...");
      setTimeout(() => router.push("/comunicados"), 1500);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar conta.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isValidandoToken) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <p className="text-slate-500">Validando convite...</p>
      </main>
    );
  }

  if (conviteErro) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Convite inválido</h1>
          <p className="mt-2 text-sm text-slate-500">{conviteErro}</p>
          <Link href="/" className="mt-6 inline-block text-sm font-semibold text-[#003882] hover:underline">
            Voltar para login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#003882]/10 text-sm font-bold text-[#003882] mb-3">
            DC
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Criar sua conta</h1>
          <p className="mt-1 text-sm text-slate-500">
            Você foi convidado para acessar a plataforma da Defesa Civil de Pernambuco.{" "}
            {conviteInfo?.cargo && (
              <span className="font-medium">
                Cargo: <span className="text-[#003882]">{conviteInfo.cargo}</span>
              </span>
            )}
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Nome */}
          <div className="space-y-1.5">
            <label htmlFor="nome" className="block text-sm font-semibold text-slate-700">
              Nome completo
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="h-12 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 text-base text-slate-900 outline-none transition-all focus:border-[#003882] focus:bg-white focus:ring-2 focus:ring-[#003882]/20"
              placeholder="Seu nome completo"
              autoComplete="name"
              required
            />
          </div>

          {/* E-mail */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!conviteInfo?.email}
              className="h-12 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 text-base text-slate-900 outline-none transition-all focus:border-[#003882] focus:bg-white focus:ring-2 focus:ring-[#003882]/20 disabled:bg-slate-100 disabled:text-slate-500"
              placeholder="voce@defesacivil.pe.gov.br"
              autoComplete="email"
              required
            />
            {conviteInfo?.email && (
              <p className="text-xs text-slate-400">E-mail definido pelo administrador.</p>
            )}
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label htmlFor="senha" className="block text-sm font-semibold text-slate-700">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => handleSenhaChange(e.target.value)}
              className="h-12 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 text-base text-slate-900 outline-none transition-all focus:border-[#003882] focus:bg-white focus:ring-2 focus:ring-[#003882]/20"
              autoComplete="new-password"
              required
            />

            {/* Indicador de requisitos em tempo real */}
            {senha.length > 0 && validacao && (
              <ul className="mt-2 space-y-1 text-xs">
                {[
                  { ok: validacao.regras.minimo8, label: "Mínimo 8 caracteres" },
                  { ok: validacao.regras.maiuscula, label: "Letra maiúscula (A-Z)" },
                  { ok: validacao.regras.minuscula, label: "Letra minúscula (a-z)" },
                  { ok: validacao.regras.numero, label: "Número (0-9)" },
                  { ok: validacao.regras.especial, label: "Caractere especial (@, #, $, !, etc.)" },
                ].map(({ ok, label }) => (
                  <li
                    key={label}
                    className={`flex items-center gap-1.5 ${ok ? "text-emerald-600" : "text-slate-400"}`}
                  >
                    <span className="font-bold">{ok ? "✓" : "○"}</span>
                    {label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Confirmar senha */}
          <div className="space-y-1.5">
            <label htmlFor="confirmarSenha" className="block text-sm font-semibold text-slate-700">
              Confirmar senha
            </label>
            <input
              id="confirmarSenha"
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className={`h-12 w-full rounded-lg border px-4 text-base text-slate-900 outline-none transition-all focus:ring-2 ${
                confirmarSenha.length > 0
                  ? confirmarSenha === senha
                    ? "border-emerald-400 bg-emerald-50 focus:border-emerald-500 focus:ring-emerald-200"
                    : "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                  : "border-slate-300 bg-slate-50 focus:border-[#003882] focus:ring-[#003882]/20"
              }`}
              autoComplete="new-password"
              required
            />
            {confirmarSenha.length > 0 && confirmarSenha !== senha && (
              <p className="text-xs text-red-600">As senhas não conferem.</p>
            )}
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !!successMessage}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-[#003882] px-5 text-base font-bold text-white transition-colors hover:bg-[#002456] focus:outline-none focus:ring-2 focus:ring-[#003882] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Criando conta..." : "Criar minha conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link href="/" className="font-semibold text-[#003882] hover:text-[#002456]">
            Fazer login
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Carregando...</p>
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}
