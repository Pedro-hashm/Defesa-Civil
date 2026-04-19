declare namespace Express {
  interface Request {
    usuario?: {
      id: number;
      nome: string;
      email: string;
      cargo: import("@prisma/client").Cargo;
      ativo: boolean;
      criado_em: Date;
    };
  }
}
