import { Request, Response } from 'express';
import { OrdemService } from './ordem.service';

const ordemService = new OrdemService();

export class OrdemController {
  async criar(req: Request, res: Response) {
    try {
      const ordem = await ordemService.create(req.body);
      return res.status(201).json(ordem);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Já existe uma ordem com este nome.' });
      }
      return res.status(400).json({ error: error.message || 'Erro ao criar ordem.' });
    }
  }

  async listar(req: Request, res: Response) {
    const ordens = await ordemService.getAll();
    return res.json(ordens);
  }

  /** GET /ordens/ativas — público (sem auth), usado nos selects */
  async listarAtivas(req: Request, res: Response) {
    const ordens = await ordemService.getAtivas();
    return res.json(ordens);
  }

  async buscar(req: Request, res: Response) {
    const id = Number(req.params.id);
    const ordem = await ordemService.getById(id);
    if (!ordem) return res.status(404).json({ error: 'Ordem não encontrada.' });
    return res.json(ordem);
  }

  async atualizar(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const ordem = await ordemService.update(id, req.body);
      return res.json(ordem);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Já existe uma ordem com este nome.' });
      }
      return res.status(400).json({ error: error.message || 'Erro ao atualizar ordem.' });
    }
  }

  async deletar(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const ordem = await ordemService.delete(id);
      return res.json({ message: 'Ordem excluída com sucesso.', ordem });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao excluir ordem.' });
    }
  }
}
