export interface CreateUsuarioDTO {
  nome: string;
  email: string;
  senha_hash: string;
  cargo: "ADMIN" | "ALUNO";
  ativo?: boolean;
}

export interface UpdateUsuarioDTO {
  nome?: string;
  email?: string;
  senha_hash?: string;
  cargo?: 'ADMIN' | 'ALUNO';
  ativo?: boolean;
}