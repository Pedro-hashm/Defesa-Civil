export interface CreateUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
  cargo: "ADMIN" | "ALUNO";
  ativo?: boolean;
  ordem_id?: number | null;
}

export interface UpdateUsuarioDTO {
  nome?: string;
  email?: string;
  senha?: string;
  cargo?: 'ADMIN' | 'ALUNO';
  ativo?: boolean;
  ordem_id?: number | null;
}
