import { Request, Response, NextFunction } from "express";
import { Cargo } from "@prisma/client";
import { doesNotMatch } from "node:assert/strict";

export function rolesMiddleware(...cargosPermitidos: Cargo[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return res.status(401).json({ error: "Não autenticado." });
    }

    if (!cargosPermitidos.includes(req.usuario.cargo)) {
      return res.status(403).json({ error: "Acesso negado. Cargo insuficiente." });
    }

    next();
  };
}
