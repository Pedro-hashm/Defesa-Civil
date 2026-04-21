"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { forgotPassword } from "../../services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await forgotPassword(email);
      setSuccessMessage(response.message);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao solicitar redefinicao de senha.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Esqueci minha senha</h1>
        <p className="mt-2 text-sm text-slate-500">
          Informe seu e-mail para receber um link de redefinicao.
        </p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#003882] focus:bg-white focus:ring-2 focus:ring-[#003882]/20"
              placeholder="voce@defesacivil.pe.gov.br"
              autoComplete="email"
              required
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
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-[#003882] px-5 text-base font-bold text-white transition-colors hover:bg-[#002456] focus:outline-none focus:ring-2 focus:ring-[#003882] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Enviando..." : "Enviar link de redefinicao"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Lembrou a senha?{" "}
          <Link href="/" className="font-semibold text-[#003882] hover:text-[#002456]">
            Voltar para login
          </Link>
        </p>
      </section>
    </main>
  );
}
