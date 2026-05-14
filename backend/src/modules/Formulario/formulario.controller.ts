import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { FormularioService } from "./formulario.service";

const formularioService = new FormularioService();

function isNaoEncontrado(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

export class FormularioController {
  async listarFormularios(req: Request, res: Response) {
    const lista = await formularioService.listarFormularios();
    return res.json(lista);
  }

  async buscarFormulario(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "ID invalido." });
    }
    const form = await formularioService.buscarFormulario(id);
    if (!form) {
      return res.status(404).json({ error: "Formulario nao encontrado." });
    }
    return res.json(form);
  }

  async criarTentativa(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario!.id;
      const tentativa = await formularioService.criarTentativa(usuarioId, req.body);
      return res.status(201).json(tentativa);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro ao criar tentativa.";
      if (msg.includes("nao encontrado")) {
        return res.status(400).json({ error: msg });
      }
      return res.status(400).json({ error: msg });
    }
  }

  async listarTentativas(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario!.id;
      const cargo = req.usuario!.cargo;
      const lista = await formularioService.listarTentativas(usuarioId, cargo);
      return res.json(lista);
    } catch (error: unknown) {
      return res.status(400).json({
        error:
          error instanceof Error ? error.message : "Erro ao listar tentativas.",
      });
    }
  }

  async buscarTentativa(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: "ID invalido." });
      }
      const usuarioId = req.usuario!.id;
      const cargo = req.usuario!.cargo;
      const row = await formularioService.buscarTentativa(id, usuarioId, cargo);
      if (!row) {
        return res.status(404).json({ error: "Tentativa nao encontrada." });
      }
      return res.json(row);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro ao buscar tentativa.";
      if (msg.includes("Acesso negado")) {
        return res.status(403).json({ error: msg });
      }
      return res.status(400).json({ error: msg });
    }
  }

  async atualizarTentativa(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: "ID invalido." });
      }
      const usuarioId = req.usuario!.id;
      const cargo = req.usuario!.cargo;
      const tentativa = await formularioService.atualizarTentativa(
        id,
        usuarioId,
        cargo,
        req.body
      );
      return res.json(tentativa);
    } catch (error: unknown) {
      if (isNaoEncontrado(error)) {
        return res.status(404).json({ error: "Tentativa nao encontrada." });
      }
      const msg = error instanceof Error ? error.message : "Erro ao atualizar tentativa.";
      if (msg.includes("Acesso negado")) {
        return res.status(403).json({ error: msg });
      }
      return res.status(400).json({ error: msg });
    }
  }

  async deletarTentativa(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: "ID invalido." });
      }
      const usuarioId = req.usuario!.id;
      const cargo = req.usuario!.cargo;
      const removido = await formularioService.deletarTentativa(id, usuarioId, cargo);
      return res.json({
        message: "Tentativa removida com sucesso.",
        tentativa: removido,
      });
    } catch (error: unknown) {
      if (isNaoEncontrado(error)) {
        return res.status(404).json({ error: "Tentativa nao encontrada." });
      }
      const msg = error instanceof Error ? error.message : "Erro ao deletar tentativa.";
      if (msg.includes("Acesso negado")) {
        return res.status(403).json({ error: msg });
      }
      return res.status(400).json({ error: msg });
    }
  }
}
