import { prisma } from "../../config/prisma";
import { aplicarPepper, validarForcaSenha } from "../../config/password";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  AuthResponseDTO,
  CadastroDTO,
  ConviteInfoDTO,
  ConviteResponseDTO,
  CriarConviteDTO,
  ForgotPasswordDTO,
  LoginDTO,
  RegistrarComConviteDTO,
  ResetPasswordDTO,
} from "./auth.dto";

export class AuthService {
  private readonly SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias
  private readonly RESET_TOKEN_DURATION_MS = 1000 * 60 * 15;       // 15 minutos
  private readonly INVITE_TOKEN_DURATION_MS = 1000 * 60 * 60 * 48; // 48 horas
  private readonly MAX_TENTATIVAS_LOGIN = 5;
  private readonly BLOQUEIO_DURATION_MS = 1000 * 60 * 15;           // 15 minutos
  private readonly FRONTEND_SENHA_PREFIXO = process.env.FRONTEND_SENHA_PREFIXO ?? "dc@";
  private readonly FRONTEND_SENHA_SUFIXO = process.env.FRONTEND_SENHA_SUFIXO ?? "@dc";

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private getForgotPasswordResponse() {
    return {
      message:
        "Se o e-mail estiver cadastrado, voce recebera instrucoes para redefinir a senha.",
    };
  }

  private getFrontendUrl(): string {
    return process.env.FRONTEND_URL?.replace(/\/$/, "") || "http://localhost:3000";
  }

  /** Cria sessão e retorna token. */
  private async criarSessao(usuarioId: number): Promise<{ token: string; expira_em: Date }> {
    const token = crypto.randomBytes(48).toString("hex");
    const expira_em = new Date(Date.now() + this.SESSION_DURATION_MS);
    await prisma.sessao.create({ data: { usuario_id: usuarioId, token, expira_em } });
    return { token, expira_em };
  }

  /** Hashes a senha recebida do frontend com pepper antes de bcrypt. */
  private async hashSenha(senhaDoFront: string): Promise<string> {
    return bcrypt.hash(aplicarPepper(senhaDoFront), 10);
  }

  /** Compatibilidade com a senha legada do frontend/seed. */
  private hashFrontendLegado(senha: string): string {
    return crypto
      .createHash("sha256")
      .update(`${this.FRONTEND_SENHA_PREFIXO}${senha}${this.FRONTEND_SENHA_SUFIXO}`)
      .digest("hex");
  }

  /** Verifica a senha recebida do frontend contra o hash armazenado. */
  private async verificarSenha(senhaDoFront: string, hash: string): Promise<boolean> {
    return bcrypt.compare(aplicarPepper(senhaDoFront), hash);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CADASTRO DIRETO (fluxo legado, somente admin usa via painel)
  // ─────────────────────────────────────────────────────────────────────────

  async cadastro(data: CadastroDTO): Promise<AuthResponseDTO> {
    if (!data.nome || !data.email || !data.senha) {
      throw new Error("Campos obrigatorios: nome, email e senha.");
    }

    const validacao = validarForcaSenha(data.senha);
    if (!validacao.valida) {
      throw new Error(validacao.erros.join(" | "));
    }

    const email = data.email.trim().toLowerCase();
    const senhaHash = await this.hashSenha(data.senha);
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

    await prisma.sessao.deleteMany({ where: { usuario_id: usuario.id } });
    const sessao = await this.criarSessao(usuario.id);

    return { ...sessao, usuario };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Verifica o token reCAPTCHA v2 junto à API do Google.
   * Se RECAPTCHA_SECRET_KEY não estiver definida (dev sem config), libera o acesso.
   */
  private async verificarRecaptcha(token: string): Promise<void> {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) return; // variável ausente = ambiente de dev sem recaptcha configurado

    const params = new URLSearchParams({ secret: secretKey, response: token });
    const res = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?${params}`,
      { method: "POST" }
    );
    const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };

    if (!data.success) {
      throw new Error("Verificacao do reCAPTCHA falhou. Confirme que voce nao e um robo.");
    }
  }

  async login(data: LoginDTO): Promise<AuthResponseDTO> {
    if (!data.email || !data.senha) {
      throw new Error("Campos obrigatorios: email e senha.");
    }

    // Valida reCAPTCHA antes de qualquer consulta ao banco
    await this.verificarRecaptcha(data.recaptcha_token);

    const email = data.email.trim().toLowerCase();
    const agora = new Date();

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
        tentativas_login: true,
        bloqueado_ate: true,
      },
    });

    if (!usuario) throw new Error("Credenciais invalidas.");
    if (!usuario.ativo) throw new Error("Usuario inativo.");

    // Verifica bloqueio ativo
    if (usuario.bloqueado_ate && usuario.bloqueado_ate > agora) {
      const minutosRestantes = Math.ceil(
        (usuario.bloqueado_ate.getTime() - agora.getTime()) / 60000
      );
      throw new Error(
        `Conta temporariamente bloqueada. Tente novamente em ${minutosRestantes} minuto(s).`
      );
    }

    const candidatos = [
      data.senha,
      this.hashFrontendLegado(data.senha),
    ];

    const senhaCorreta = (
      await Promise.all(
        candidatos.map((candidato) => this.verificarSenha(candidato, usuario.senha_hash))
      )
    ).some(Boolean);

    if (!senhaCorreta) {
      const novasTentativas = usuario.tentativas_login + 1;
      const deveBloquear = novasTentativas >= this.MAX_TENTATIVAS_LOGIN;

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          tentativas_login: novasTentativas,
          bloqueado_ate: deveBloquear
            ? new Date(agora.getTime() + this.BLOQUEIO_DURATION_MS)
            : undefined,
        },
      });

      if (deveBloquear) {
        throw new Error(
          `Muitas tentativas incorretas. Conta bloqueada por ${this.BLOQUEIO_DURATION_MS / 60000} minutos.`
        );
      }

      const restantes = this.MAX_TENTATIVAS_LOGIN - novasTentativas;
      throw new Error(
        `Credenciais invalidas. ${restantes} tentativa(s) restante(s) antes do bloqueio.`
      );
    }

    // Login correto: zera contador e bloqueio
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { tentativas_login: 0, bloqueado_ate: null },
    });

    await prisma.sessao.deleteMany({ where: { usuario_id: usuario.id } });
    const sessao = await this.criarSessao(usuario.id);

    return {
      ...sessao,
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

  // ─────────────────────────────────────────────────────────────────────────
  // RECUPERAÇÃO DE SENHA (usuário solicita por e-mail)
  // ─────────────────────────────────────────────────────────────────────────

  async forgotPassword(data: ForgotPasswordDTO): Promise<{ message: string }> {
    if (!data.email) return this.getForgotPasswordResponse();

    const email = data.email.trim().toLowerCase();
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true, ativo: true },
    });

    if (!usuario || !usuario.ativo) return this.getForgotPasswordResponse();

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);
    const expiraEm = new Date(Date.now() + this.RESET_TOKEN_DURATION_MS);

    await prisma.recuperacaoSenha.create({
      data: { usuario_id: usuario.id, token_hash: tokenHash, expira_em: expiraEm },
    });

    const resetLink = `${this.getFrontendUrl()}/reset-password?token=${token}`;

    console.info(`[AUTH] Reset de senha solicitado para usuario ${usuario.id}`);
    console.info(`[AUTH] Link de reset: ${resetLink}`);

    return this.getForgotPasswordResponse();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RESET DE SENHA (via token de e-mail ou gerado pelo admin)
  // ─────────────────────────────────────────────────────────────────────────

  async resetPassword(data: ResetPasswordDTO): Promise<{ message: string }> {
    if (!data.token || !data.nova_senha) {
      throw new Error("Token e nova_senha sao obrigatorios.");
    }

    const validacao = validarForcaSenha(data.nova_senha);
    if (!validacao.valida) {
      throw new Error(validacao.erros.join(" | "));
    }

    const tokenHash = this.hashToken(data.token);
    const agora = new Date();

    const recuperacao = await prisma.recuperacaoSenha.findUnique({
      where: { token_hash: tokenHash },
      select: { id: true, usuario_id: true, expira_em: true, usado_em: true },
    });

    if (!recuperacao || recuperacao.usado_em || recuperacao.expira_em <= agora) {
      throw new Error("Token invalido ou expirado.");
    }

    const novaSenhaHash = await this.hashSenha(data.nova_senha);

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

  // ─────────────────────────────────────────────────────────────────────────
  // GERAÇÃO DE LINK DE RESET PELO ADMIN (para um usuário específico)
  // ─────────────────────────────────────────────────────────────────────────

  async gerarLinkResetAdmin(
    usuarioId: number
  ): Promise<{ link: string; expira_em: Date }> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, ativo: true },
    });

    if (!usuario) throw new Error("Usuário não encontrado.");

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);
    const expiraEm = new Date(Date.now() + this.RESET_TOKEN_DURATION_MS);

    await prisma.recuperacaoSenha.create({
      data: { usuario_id: usuario.id, token_hash: tokenHash, expira_em: expiraEm },
    });

    const link = `${this.getFrontendUrl()}/reset-password?token=${token}`;

    console.info(`[AUTH] Link de reset gerado pelo admin para usuario ${usuarioId}`);
    console.info(`[AUTH] Link: ${link}`);

    return { link, expira_em: expiraEm };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SISTEMA DE CONVITES (admin gera → usuário se cadastra)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Admin cria um token de convite.
   * - email (opcional): pré-preenche e valida o e-mail no registro.
   * - cargo (opcional): define o cargo padrão do futuro usuário.
   * Token expira em 48 h e é de uso único.
   */
  async criarConvite(
    adminId: number,
    data: CriarConviteDTO
  ): Promise<ConviteResponseDTO> {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);
    const expiraEm = new Date(Date.now() + this.INVITE_TOKEN_DURATION_MS);
    const cargo = data.cargo ?? "ALUNO";

    await prisma.conviteRegistro.create({
      data: {
        criado_por_id: adminId,
        token_hash: tokenHash,
        email: data.email?.trim().toLowerCase() ?? null,
        cargo,
        expira_em: expiraEm,
      },
    });

    const link = `${this.getFrontendUrl()}/register?token=${token}`;

    console.info(`[AUTH] Convite criado pelo admin ${adminId}`);
    console.info(`[AUTH] Link de convite: ${link}`);

    return { link, expira_em: expiraEm, email: data.email, cargo };
  }

  /**
   * Valida um token de convite e retorna suas informações (sem consumi-lo).
   * Usado pelo frontend para pré-preencher o formulário.
   */
  async validarConvite(token: string): Promise<ConviteInfoDTO> {
    if (!token) throw new Error("Token ausente.");

    const tokenHash = this.hashToken(token);
    const agora = new Date();

    const convite = await prisma.conviteRegistro.findUnique({
      where: { token_hash: tokenHash },
      select: { email: true, cargo: true, expira_em: true, usado_em: true },
    });

    if (!convite || convite.usado_em || convite.expira_em <= agora) {
      throw new Error("Convite inválido ou expirado.");
    }

    return {
      email: convite.email ?? undefined,
      cargo: convite.cargo,
      expira_em: convite.expira_em,
    };
  }

  /**
   * Registra um novo usuário usando um token de convite.
   * - Se o convite tiver e-mail, o e-mail enviado deve coincidir.
   * - O token é marcado como usado (single-use).
   */
  async registrarComConvite(data: RegistrarComConviteDTO): Promise<AuthResponseDTO> {
    if (!data.token || !data.nome || !data.email || !data.senha) {
      throw new Error("Campos obrigatorios: token, nome, email e senha.");
    }

    const validacao = validarForcaSenha(data.senha);
    if (!validacao.valida) {
      throw new Error(validacao.erros.join(" | "));
    }

    const tokenHash = this.hashToken(data.token);
    const agora = new Date();

    const convite = await prisma.conviteRegistro.findUnique({
      where: { token_hash: tokenHash },
      select: { id: true, email: true, cargo: true, expira_em: true, usado_em: true },
    });

    if (!convite || convite.usado_em || convite.expira_em <= agora) {
      throw new Error("Convite inválido ou expirado.");
    }

    const email = data.email.trim().toLowerCase();

    if (convite.email && convite.email !== email) {
      throw new Error("O e-mail não corresponde ao convite.");
    }

    const senhaHash = await this.hashSenha(data.senha);

    const resultado = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome: data.nome.trim(),
          email,
          senha_hash: senhaHash,
          cargo: convite.cargo,
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

      await tx.conviteRegistro.update({
        where: { id: convite.id },
        data: { usado_em: agora },
      });

      return usuario;
    });

    await prisma.sessao.deleteMany({ where: { usuario_id: resultado.id } });
    const sessao = await this.criarSessao(resultado.id);

    return { ...sessao, usuario: resultado };
  }
}
