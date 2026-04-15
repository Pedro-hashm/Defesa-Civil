import { Request, Response } from "express";
import { AuthService } from "./auth.service";

const authService = new AuthService();

export class AuthController {
  async cadastro(req: Request, res: Response) {
    try {
      const response = await authService.cadastro(req.body);
      return res.status(201).json(response);
    } catch (error: any) {
      if (error.code === "P2002" && error.meta?.target?.includes("email")) {
        return res.status(400).json({ error: "E-mail ja cadastrado." });
      }

      return res.status(400).json({ error: error.message || "Erro no cadastro." });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const response = await authService.login(req.body);
      return res.status(200).json(response);
    } catch (error: any) {
      if (error.message === "Credenciais invalidas." || error.message === "Usuario inativo.") {
        return res.status(401).json({ error: error.message });
      }

      return res.status(400).json({ error: error.message || "Erro no login." });
    }
  }
}