"use client";

import { hashSenhaFront } from "../lib/passwordUtils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

type ApiError = {
  message?: string;
  error?: string;
};

export type LoginResponse = {
  token: string;
  expira_em: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
    cargo: "ADMIN" | "ALUNO" | string;
    ativo: boolean;
    criado_em: string;
  };
};

export type ConviteInfo = {
  email?: string;
  cargo: "ADMIN" | "ALUNO";
  expira_em: string;
};

export type ConviteResponse = {
  link: string;
  expira_em: string;
  email?: string;
  cargo: "ADMIN" | "ALUNO";
};

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | ApiError;

  if (!response.ok) {
    const fallbackMessage = "Nao foi possivel concluir a solicitacao.";
    const errorMessage =
      (data as ApiError).message || (data as ApiError).error || fallbackMessage;
    throw new Error(errorMessage);
  }

  return data as T;
}

function getAuthHeader(): Record<string, string> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("defesa-civil.token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email: string, senha: string, recaptchaToken: string): Promise<LoginResponse> {
  const senhaHash = await hashSenhaFront(senha);

  console.log("DEBUG ENV FRONT:", {
    prefixo: process.env.NEXT_PUBLIC_SENHA_PREFIXO,
    sufixo: process.env.NEXT_PUBLIC_SENHA_SUFIXO
  });

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      senha: senhaHash,
      recaptcha_token: recaptchaToken,
    }),
  });

  return parseResponse<LoginResponse>(response);
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });

  return parseResponse<{ message: string }>(response);
}

export async function resetPassword(
  token: string,
  novaSenha: string,
): Promise<{ message: string }> {
  const senhaHash = await hashSenhaFront(novaSenha);

  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, nova_senha: senhaHash }),
  });

  return parseResponse<{ message: string }>(response);
}

/** Admin cria um link de convite */
export async function criarConvite(
  email?: string,
  cargo?: "ADMIN" | "ALUNO",
): Promise<ConviteResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/convite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ email, cargo }),
  });

  return parseResponse<ConviteResponse>(response);
}

/** Valida token de convite antes de mostrar o formulário */
export async function validarConvite(token: string): Promise<ConviteInfo> {
  const response = await fetch(`${API_BASE_URL}/auth/convite/${token}`);
  return parseResponse<ConviteInfo>(response);
}

/** Usuário se registra usando token de convite */
export async function registrarComConvite(
  token: string,
  nome: string,
  email: string,
  senha: string,
): Promise<LoginResponse> {
  const senhaHash = await hashSenhaFront(senha);

  const response = await fetch(`${API_BASE_URL}/auth/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, nome, email, senha: senhaHash }),
  });

  return parseResponse<LoginResponse>(response);
}

/** Admin gera link de reset de senha para um usuário específico */
export async function gerarLinkResetAdmin(
  usuarioId: number,
): Promise<{ link: string; expira_em: string }> {
  const response = await fetch(
    `${API_BASE_URL}/usuarios/${usuarioId}/gerar-link-reset`,
    {
      method: "POST",
      headers: { ...getAuthHeader() },
    },
  );

  return parseResponse<{ link: string; expira_em: string }>(response);
}

