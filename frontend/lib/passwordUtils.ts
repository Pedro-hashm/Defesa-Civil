/**
 * Utilitários de segurança para senhas no lado do cliente.
 *
 * Fluxo de proteção (frontend):
 *   texto_final = PREFIXO + senha_digitada + SUFIXO
 *   hash = SHA-256(texto_final)   ← o que trafega pela rede
 *
 * PREFIXO e SUFIXO são configurados via variáveis de ambiente para que
 * nunca sejam hardcoded e possam ser rotacionados por ambiente.
 */

const PREFIXO = process.env.NEXT_PUBLIC_SENHA_PREFIXO ?? "dc@";
const SUFIXO  = process.env.NEXT_PUBLIC_SENHA_SUFIXO  ?? "@dc";

/**
 * Monta a string final antes do hash:
 *   PREFIXO + senha + SUFIXO
 * Torna o texto completamente diferente da senha original antes de criptografar.
 */
function montarTextoSenha(senha: string): string {
  return `${PREFIXO}${senha}${SUFIXO}`;
}

/**
 * Calcula SHA-256 de (PREFIXO + senha + SUFIXO) usando a Web Crypto API nativa.
 * Retorna o hash em hexadecimal (64 chars).
 * Nunca a senha em texto puro trafega pela rede.
 */
export async function hashSenhaFront(senha: string): Promise<string> {
  const texto = montarTextoSenha(senha);
  const encoded = new TextEncoder().encode(texto);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface RegrasSenha {
  minimo8: boolean;
  maiuscula: boolean;
  minuscula: boolean;
  numero: boolean;
  especial: boolean;
}

export interface ValidacaoSenhaFront {
  valida: boolean;
  regras: RegrasSenha;
  erros: string[];
}

/**
 * Valida a força da senha no frontend (feedback em tempo real).
 * Mesmas regras do backend para consistência.
 */
export function validarForcaSenhaFront(senha: string): ValidacaoSenhaFront {
  const regras: RegrasSenha = {
    minimo8: senha.length >= 8,
    maiuscula: /[A-Z]/.test(senha),
    minuscula: /[a-z]/.test(senha),
    numero: /[0-9]/.test(senha),
    especial: /[@#$!%*?&\-_=+<>]/.test(senha),
  };

  const erros: string[] = [];
  if (!regras.minimo8) erros.push("Mínimo de 8 caracteres");
  if (!regras.maiuscula) erros.push("Pelo menos uma letra maiúscula");
  if (!regras.minuscula) erros.push("Pelo menos uma letra minúscula");
  if (!regras.numero) erros.push("Pelo menos um número");
  if (!regras.especial)
    erros.push("Pelo menos um caractere especial (@, #, $, !, etc.)");

  return {
    valida: Object.values(regras).every(Boolean),
    regras,
    erros,
  };
}

