import { Request, Response } from 'express';
import { UsuarioService } from './usuario.service';

const usuarioService = new UsuarioService();

export class UsuarioController {

async criar(req: Request, res: Response) {
  try {
    const usuario = await usuarioService.create(req.body);
    return res.status(201).json(usuario);
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error); // Loga o erro completo no console

    // Se for erro de email duplicado (violação de unique constraint)
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(400).json({ error: "E-mail já cadastrado." });
    }

    // Erro genérico
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
      return res.status(400).json({ error: "Erro ao atualizar usuário." });
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
}