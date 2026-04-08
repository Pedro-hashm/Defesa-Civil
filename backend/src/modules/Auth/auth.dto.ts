export interface CadastroDTO {
  nome: string;
  email: string;
  senha: string;
  cargo?: "ADMIN" | "ALUNO";
}

export interface LoginDTO {
  email: string;
  senha: string;
}

export interface AuthResponseDTO {
  token: string;
  expira_em: Date;
  usuario: {
    id: number;
    nome: string;
    email: string;
    cargo: "ADMIN" | "ALUNO";
    ativo: boolean;
    criado_em: Date;
  };
}