import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ComunicadoService } from './comunicado.service';

const comunicadoService = new ComunicadoService();

function isNaoEncontrado(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

export class ComunicadoController {
  async criar(req: Request, res: Response) {
    try {
      const autorId = req.usuario!.id;
      const comunicado = await comunicadoService.create(autorId, req.body);
      return res.status(201).json(comunicado);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Erro ao criar comunicado." });
    }
  }

  async listar(req: Request, res: Response) {
    const comunicados = await comunicadoService.getAll();
    return res.json(comunicados);
  }

  async buscar(req: Request, res: Response) {
    const id = Number(req.params.id);
    const comunicado = await comunicadoService.getById(id);
    if (!comunicado) return res.status(404).json({ error: "Comunicado nao encontrado." });
    return res.json(comunicado);
  }

  async atualizar(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const comunicado = await comunicadoService.update(id, req.body);
      return res.json(comunicado);
    } catch (error: any) {
      if (isNaoEncontrado(error)) {
        return res.status(404).json({ error: "Comunicado nao encontrado." });
      }
      return res.status(400).json({ error: error.message || "Erro ao atualizar comunicado." });
    }
  }

  async deletar(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const comunicado = await comunicadoService.delete(id);
      return res.json({ message: "Comunicado deletado com sucesso.", comunicado });
    } catch (error: any) {
      if (isNaoEncontrado(error)) {
        return res.status(404).json({ error: "Comunicado nao encontrado." });
      }
      return res.status(400).json({ error: error.message || "Erro ao deletar comunicado." });
    }
  }
}
