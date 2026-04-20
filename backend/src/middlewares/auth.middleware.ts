import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido." });
  }

  const token = authHeader.split(" ")[1];

  const sessao = await prisma.sessao.findFirst({
    where: { token },
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          cargo: true,
          ativo: true,
          criado_em: true,
        },
      },
    },
  });

  if (!sessao) {
    return res.status(401).json({ error: "Token inválido." });
  }

  if (sessao.expira_em < new Date()) {
    return res.status(401).json({ error: "Token expirado." });
  }

  if (!sessao.usuario.ativo) {
    return res.status(401).json({ error: "Usuário inativo." });
  }

  req.usuario = sessao.usuario;

  next();
}
