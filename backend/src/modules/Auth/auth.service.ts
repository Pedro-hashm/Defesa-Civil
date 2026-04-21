import { prisma } from "../../config/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  AuthResponseDTO,
  CadastroDTO,
  ForgotPasswordDTO,
  LoginDTO,
  ResetPasswordDTO,
} from "./auth.dto";

export class AuthService {
  private readonly SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias
  private readonly RESET_TOKEN_DURATION_MS = 1000 * 60 * 15; // 15 minutos

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private getForgotPasswordResponse() {
    return {
      message:
        "Se o e-mail estiver cadastrado, voce recebera instrucoes para redefinir a senha.",
    };
  }

  async cadastro(data: CadastroDTO): Promise<AuthResponseDTO> {
    if (!data.nome || !data.email || !data.senha) {
      throw new Error("Campos obrigatorios: nome, email e senha.");
    }

    const email = data.email.trim().toLowerCase();

    const senhaHash = await bcrypt.hash(data.senha, 10);
    const cargo = data.cargo ?? "ALUNO";

    const usuario = await prisma.usuario.create({
      data: {
        nome: data.nome.trim(),
        email,
        senha_hash: senhaHash,
        cargo,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        ativo: true,
        criado_em: true,
      },
    });

    const token = crypto.randomBytes(48).toString("hex");
    const expira_em = new Date(Date.now() + this.SESSION_DURATION_MS);

    await prisma.sessao.create({
      data: {
        usuario_id: usuario.id,
        token,
        expira_em,
      },
    });

    return {
      token,
      expira_em,
      usuario,
    };
  }

  async login(data: LoginDTO): Promise<AuthResponseDTO> {
    if (!data.email || !data.senha) {
      throw new Error("Campos obrigatorios: email e senha.");
    }

    const email = data.email.trim().toLowerCase();

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        senha_hash: true,
        cargo: true,
        ativo: true,
        criado_em: true,
      },
    });

    if (!usuario) {
      throw new Error("Credenciais invalidas.");
    }

    if (!usuario.ativo) {
      throw new Error("Usuario inativo.");
    }

    const senhaCorreta = await bcrypt.compare(data.senha, usuario.senha_hash);
    if (!senhaCorreta) {
      throw new Error("Credenciais invalidas.");
    }

    const token = crypto.randomBytes(48).toString("hex");
    const expira_em = new Date(Date.now() + this.SESSION_DURATION_MS);

    await prisma.sessao.create({
      data: {
        usuario_id: usuario.id,
        token,
        expira_em,
      },
    });

    return {
      token,
      expira_em,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
        ativo: usuario.ativo,
        criado_em: usuario.criado_em,
      },
    };
  }

  async forgotPassword(data: ForgotPasswordDTO): Promise<{ message: string }> {
    if (!data.email) {
      return this.getForgotPasswordResponse();
    }

    const email = data.email.trim().toLowerCase();
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true, ativo: true },
    });

    if (!usuario || !usuario.ativo) {
      return this.getForgotPasswordResponse();
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);
    const expiraEm = new Date(Date.now() + this.RESET_TOKEN_DURATION_MS);

    await prisma.recuperacaoSenha.create({
      data: {
        usuario_id: usuario.id,
        token_hash: tokenHash,
        expira_em: expiraEm,
      },
    });

    const frontendBaseUrl =
      process.env.FRONTEND_URL?.replace(/\/$/, "") || "http://localhost:3000";
    const resetLink = `${frontendBaseUrl}/reset-password?token=${token}`;

    // Simula envio de e-mail. Em producao, trocar por provider SMTP/API.
    console.info(`[AUTH] Reset de senha solicitado para usuario ${usuario.id}`);
    console.info(`[AUTH] Link de reset: ${resetLink}`);

    return this.getForgotPasswordResponse();
  }

  async resetPassword(data: ResetPasswordDTO): Promise<{ message: string }> {
    if (!data.token || !data.nova_senha) {
      throw new Error("Token e nova_senha sao obrigatorios.");
    }

    if (data.nova_senha.length < 8) {
      throw new Error("A nova senha deve ter pelo menos 8 caracteres.");
    }

    const tokenHash = this.hashToken(data.token);
    const agora = new Date();

    const recuperacao = await prisma.recuperacaoSenha.findUnique({
      where: { token_hash: tokenHash },
      select: {
        id: true,
        usuario_id: true,
        expira_em: true,
        usado_em: true,
      },
    });

    if (!recuperacao || recuperacao.usado_em || recuperacao.expira_em <= agora) {
      throw new Error("Token invalido ou expirado.");
    }

    const novaSenhaHash = await bcrypt.hash(data.nova_senha, 10);

    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: recuperacao.usuario_id },
        data: { senha_hash: novaSenhaHash },
      }),
      prisma.recuperacaoSenha.update({
        where: { id: recuperacao.id },
        data: { usado_em: agora },
      }),
    ]);

    return { message: "Senha redefinida com sucesso." };
  }
}