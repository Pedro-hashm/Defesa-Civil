"use client";

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

export async function login(email: string, senha: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      senha,
    }),
  });

  return parseResponse<LoginResponse>(response);
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
    }),
  });

  return parseResponse<{ message: string }>(response);
}

export async function resetPassword(
  token: string,
  novaSenha: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      nova_senha: novaSenha,
    }),
  });

  return parseResponse<{ message: string }>(response);
}
