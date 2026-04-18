import { Cargo } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: number;
        nome: string;
        email: string;
        cargo: Cargo;
        ativo: boolean;
        criado_em: Date;
      };
    }
  }
}
