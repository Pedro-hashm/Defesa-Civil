export interface CreateOrdemDTO {
  nome: string;
  descricao?: string;
}

export interface UpdateOrdemDTO {
  nome?: string;
  descricao?: string;
  ativo?: boolean;
}
