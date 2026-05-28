export interface CadastroDTO {
  nome: string;
  email: string;
  senha: string;
  cargo?: "ADMIN" | "ALUNO";
}

export interface LoginDTO {
  email: string;
  senha: string;
  recaptcha_token: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  nova_senha: string;
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

/** Payload para admin criar um convite de registro */
export interface CriarConviteDTO {
  email?: string;
  cargo?: "ADMIN" | "ALUNO";
}

/** Resposta ao criar um convite */
export interface ConviteResponseDTO {
  link: string;
  expira_em: Date;
  email?: string;
  cargo: "ADMIN" | "ALUNO";
}

/** Informações retornadas ao validar um token de convite */
export interface ConviteInfoDTO {
  email?: string;
  cargo: "ADMIN" | "ALUNO";
  expira_em: Date;
}

/** Payload para o usuário se registrar usando um convite */
export interface RegistrarComConviteDTO {
  token: string;
  nome: string;
  email: string;
  senha: string;
}
