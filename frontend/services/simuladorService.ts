import { API_URL } from "@/lib/api";
import { normalizeFideData } from "@/lib/fideNormalize";

type ApiError = {
  message?: string;
  error?: string;
};

type FormularioResumo = {
  id: number;
  titulo: string;
  descricao: string | null;
  ativo: boolean;
  criado_em: string;
};

type SalvarTentativaPayload = {
  fide: Record<string, unknown>;
  dmate: Record<string, unknown>;
};

function getAuthHeader(): Record<string, string> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("defesa-civil.token")
      : null;

  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | ApiError;

  if (!response.ok) {
    const fallback = "Nao foi possivel concluir a solicitacao.";
    const message =
      (data as ApiError).message ?? (data as ApiError).error ?? fallback;
    throw new Error(message);
  }

  return data as T;
}

async function getFormularioIdFide(): Promise<number> {
  const response = await fetch(`${API_URL}/formularios`, {
    headers: {
      ...getAuthHeader(),
    },
  });

  const formularios = await parseResponse<FormularioResumo[]>(response);

  const formularioFide = formularios.find((item) =>
    item.titulo.toUpperCase().includes("FIDE")
  );

  if (!formularioFide) {
    throw new Error("Formulario FIDE nao encontrado no backend.");
  }

  return formularioFide.id;
}

export async function salvarSimulacaoFideDmate(payload: SalvarTentativaPayload) {
  const formularioId = await getFormularioIdFide();

  const response = await fetch(`${API_URL}/tentativas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      formulario_id: formularioId,
      status: "FINALIZADO",
      respostas: {
        fide: normalizeFideData(payload.fide),
        dmate: payload.dmate,
      },
    }),
  });

  return parseResponse<Record<string, unknown>>(response);
}
