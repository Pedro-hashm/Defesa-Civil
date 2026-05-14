import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { UsuarioService } from './usuario.service';

const usuarioService = new UsuarioService();

export class UsuarioController {
  private isUsuarioNaoEncontrado(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
  }

async criar(req: Request, res: Response) {
  try {
    const usuario = await usuarioService.create(req.body);
    return res.status(201).json(usuario);
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(400).json({ error: "E-mail já cadastrado." });
    }
    return res.status(400).json({ error: error.message || "Erro ao criar usuário." });
  }
}

  async listar(req: Request, res: Response) {
    const usuarios = await usuarioService.getAll();
    return res.json(usuarios);
  }

  async buscar(req: Request, res: Response) {
    const id = Number(req.params.id);
    const usuario = await usuarioService.getById(id);
    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });
    return res.json(usuario);
  }

  async atualizar(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const usuario = await usuarioService.update(id, req.body);
      return res.json(usuario);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Erro ao atualizar usuário." });
    }
  }

  async ativar(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const usuario = await usuarioService.setActive(id, true);
      return res.json({ message: "Usuário ativado com sucesso.", usuario });
    } catch (error: any) {
      if (this.isUsuarioNaoEncontrado(error)) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }
      return res.status(400).json({ error: "Erro ao ativar usuário." });
    }
  }

  async desativar(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const usuario = await usuarioService.setActive(id, false);
      return res.json({ message: "Usuário desativado com sucesso.", usuario });
    } catch (error: any) {
      if (this.isUsuarioNaoEncontrado(error)) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }
      return res.status(400).json({ error: "Erro ao desativar usuário." });
    }
  }

  async deletar(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const usuario = await usuarioService.delete(id);
      return res.json({ message: "Usuário deletado com sucesso", usuario });
    } catch (error: any) {
      return res.status(400).json({ error: "Erro ao deletar usuário." });
    }
  }

  /** POST /usuarios/:id/gerar-link-reset — Admin gera link de reset para um usuário */
  async gerarLinkReset(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const resultado = await usuarioService.gerarLinkReset(id);
      return res.status(200).json(resultado);
    } catch (error: any) {
      if (this.isUsuarioNaoEncontrado(error) || error.message === "Usuário não encontrado.") {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }
      return res.status(400).json({ error: error.message || "Erro ao gerar link de reset." });
    }
  }

  /** PATCH /usuarios/:id/desbloquear — Admin desbloqueia conta bloqueada por tentativas */
  async desbloquear(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const usuario = await usuarioService.desbloquear(id);
      return res.json({ message: "Usuário desbloqueado com sucesso.", usuario });
    } catch (error: any) {
      if (this.isUsuarioNaoEncontrado(error)) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }
      return res.status(400).json({ error: error.message || "Erro ao desbloquear usuário." });
    }
  }
}
