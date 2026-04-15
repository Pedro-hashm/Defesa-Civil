import { prisma } from "../../config/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { AuthResponseDTO, CadastroDTO, LoginDTO } from "./auth.dto";

export class AuthService {
  private readonly SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

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
}