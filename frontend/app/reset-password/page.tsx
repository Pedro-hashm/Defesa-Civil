"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "../../services/authService";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const hasToken = token.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!hasToken) {
      setErrorMessage("Token de redefinicao ausente.");
      return;
    }

    if (novaSenha.length < 8) {
      setErrorMessage("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErrorMessage("A confirmacao da senha nao confere.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await resetPassword(token, novaSenha);
      setSuccessMessage(response.message);
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao redefinir senha.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Redefinir senha</h1>
        <p className="mt-2 text-sm text-slate-500">
          Digite a nova senha para concluir a recuperacao da conta.
        </p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="novaSenha" className="block text-sm font-semibold text-slate-700">
              Nova senha
            </label>
            <input
              id="novaSenha"
              type="password"
              value={novaSenha}
              onChange={(event) => setNovaSenha(event.target.value)}
              className="h-12 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#003882] focus:bg-white focus:ring-2 focus:ring-[#003882]/20"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirmarSenha"
              className="block text-sm font-semibold text-slate-700"
            >
              Confirmar nova senha
            </label>
            <input
              id="confirmarSenha"
              type="password"
              value={confirmarSenha}
              onChange={(event) => setConfirmarSenha(event.target.value)}
              className="h-12 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#003882] focus:bg-white focus:ring-2 focus:ring-[#003882]/20"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          {errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {successMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !hasToken}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-[#003882] px-5 text-base font-bold text-white transition-colors hover:bg-[#002456] focus:outline-none focus:ring-2 focus:ring-[#003882] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Salvando..." : "Atualizar senha"}
          </button>
        </form>

        {!hasToken ? (
          <p className="mt-4 text-sm text-red-700">
            Link invalido: token nao encontrado na URL.
          </p>
        ) : null}

        <p className="mt-6 text-center text-sm text-slate-600">
          <Link href="/" className="font-semibold text-[#003882] hover:text-[#002456]">
            Voltar para login
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Carregando...</p>
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
