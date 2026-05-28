/**
 * Utilitários de segurança para senhas (servidor).
 *
 * Fluxo de proteção (backend):
 *   texto_final = PREFIXO_SERVIDOR + hash_do_front + SUFIXO_SERVIDOR
 *   armazenado  = bcrypt(texto_final, 10)
 *
 * O frontend entrega SHA-256(PREFIXO_FRONT + senha + SUFIXO_FRONT).
 * O backend concatena um segundo par prefixo/sufixo antes do bcrypt.
 * Mesmo com acesso ao banco, sem os segredos de servidor o hash é inútil.
 */

const PREFIXO_SERVIDOR = process.env.PASSWORD_PREFIXO ?? "";
const SUFIXO_SERVIDOR  = process.env.PASSWORD_SUFIXO  ?? "";

/**
 * Envolve o hash recebido do frontend com prefixo e sufixo de servidor
 * antes de passar ao bcrypt.
 */
export function aplicarPepper(hashDoFront: string): string {
  return `${PREFIXO_SERVIDOR}${hashDoFront}${SUFIXO_SERVIDOR}`;
}

export interface ValidacaoSenha {
  valida: boolean;
  erros: string[];
}

/**
 * Valida a força da senha conforme as regras do sistema.
 * Chamada tanto no cadastro quanto na redefinição de senha.
 *
 * Regras:
 *  - Mínimo de 8 caracteres
 *  - Pelo menos 1 letra maiúscula (A-Z)
 *  - Pelo menos 1 letra minúscula (a-z)
 *  - Pelo menos 1 dígito (0-9)
 *  - Pelo menos 1 caractere especial do conjunto @#$!%*?&-_=+<>
 */
export function validarForcaSenha(senha: string): ValidacaoSenha {
  const erros: string[] = [];

  if (senha.length < 8) {
    erros.push("A senha deve ter no mínimo 8 caracteres.");
  }
  if (!/[A-Z]/.test(senha)) {
    erros.push("A senha deve conter pelo menos uma letra maiúscula (A-Z).");
  }
  if (!/[a-z]/.test(senha)) {
    erros.push("A senha deve conter pelo menos uma letra minúscula (a-z).");
  }
  if (!/[0-9]/.test(senha)) {
    erros.push("A senha deve conter pelo menos um número (0-9).");
  }
  if (!/[@#$!%*?&\-_=+<>]/.test(senha)) {
    erros.push(
      "A senha deve conter pelo menos um caractere especial (@, #, $, !, %, *, etc.)."
    );
  }

  return { valida: erros.length === 0, erros };
}

