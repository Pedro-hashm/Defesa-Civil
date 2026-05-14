import { Cargo, Prisma, StatusTentativa } from "@prisma/client";
import { prisma } from "../../config/prisma";
import {
  CreateTentativaDTO,
  UpdateTentativaDTO,
} from "./formulario.dto";

const formularioSelectLista = {
  id: true,
  titulo: true,
  descricao: true,
  ativo: true,
  criado_em: true,
};

const formularioSelectDetalhe = {
  ...formularioSelectLista,
  estrutura: true,
};

const tentativaSelect = {
  id: true,
  usuario_id: true,
  formulario_id: true,
  respostas: true,
  erros: true,
  status: true,
  iniciado_em: true,
  finalizado_em: true,
  usuario: {
    select: {
      id: true,
      nome: true,
      email: true,
      cargo: true,
    },
  },
  formulario: {
    select: {
      id: true,
      titulo: true,
      descricao: true,
    },
  },
};

function assertRespostasObjeto(respostas: unknown) {
  if (
    respostas === null ||
    respostas === undefined ||
    typeof respostas !== "object" ||
    Array.isArray(respostas)
  ) {
    throw new Error("O campo 'respostas' deve ser um objeto JSON.");
  }
}

function podeGerenciarTentativa(
  cargo: Cargo,
  usuarioId: number,
  donoId: number
) {
  return cargo === "ADMIN" || usuarioId === donoId;
}

export class FormularioService {
  async listarFormularios() {
    return prisma.formulario.findMany({
      where: { ativo: true },
      orderBy: { id: "asc" },
      select: formularioSelectLista,
    });
  }

  async buscarFormulario(id: number) {
    return prisma.formulario.findFirst({
      where: { id, ativo: true },
      select: formularioSelectDetalhe,
    });
  }

  async criarTentativa(usuarioId: number, data: CreateTentativaDTO) {
    assertRespostasObjeto(data.respostas);

    const form = await prisma.formulario.findFirst({
      where: { id: data.formulario_id, ativo: true },
    });
    if (!form) {
      throw new Error("Formulario nao encontrado ou inativo.");
    }

    const status = data.status ?? StatusTentativa.FINALIZADO;
    const agora = new Date();

    return prisma.tentativaFormulario.create({
      data: {
        usuario_id: usuarioId,
        formulario_id: data.formulario_id,
        respostas: data.respostas as Prisma.InputJsonValue,
        erros:
          data.erros === undefined
            ? undefined
            : data.erros === null
              ? Prisma.JsonNull
              : (data.erros as Prisma.InputJsonValue),
        status,
        finalizado_em:
          status === StatusTentativa.FINALIZADO ? agora : undefined,
      },
      select: tentativaSelect,
    });
  }

  async listarTentativas(usuarioId: number, cargo: Cargo) {
    const where =
      cargo === "ADMIN"
        ? {}
        : { usuario_id: usuarioId };

    return prisma.tentativaFormulario.findMany({
      where,
      orderBy: { iniciado_em: "desc" },
      select: tentativaSelect,
    });
  }

  async buscarTentativa(id: number, usuarioId: number, cargo: Cargo) {
    const row = await prisma.tentativaFormulario.findUnique({
      where: { id },
      select: tentativaSelect,
    });
    if (!row) return null;
    if (!podeGerenciarTentativa(cargo, usuarioId, row.usuario_id)) {
      throw new Error("Acesso negado a esta tentativa.");
    }
    return row;
  }

  async atualizarTentativa(
    id: number,
    usuarioId: number,
    cargo: Cargo,
    data: UpdateTentativaDTO
  ) {
    const existente = await prisma.tentativaFormulario.findUnique({
      where: { id },
    });
    if (!existente) {
      const err = new Prisma.PrismaClientKnownRequestError(
        "Record not found",
        { code: "P2025", clientVersion: Prisma.prismaVersion.client }
      );
      throw err;
    }
    if (!podeGerenciarTentativa(cargo, usuarioId, existente.usuario_id)) {
      throw new Error("Acesso negado a esta tentativa.");
    }

    if (data.respostas !== undefined) {
      assertRespostasObjeto(data.respostas);
    }

    const updateData: Prisma.TentativaFormularioUpdateInput = {};
    if (data.respostas !== undefined) {
      updateData.respostas = data.respostas as Prisma.InputJsonValue;
    }
    if (data.erros !== undefined) {
      updateData.erros =
        data.erros === null
          ? Prisma.JsonNull
          : (data.erros as Prisma.InputJsonValue);
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === StatusTentativa.FINALIZADO && !existente.finalizado_em) {
        updateData.finalizado_em = new Date();
      }
      if (data.status === StatusTentativa.INICIADO) {
        updateData.finalizado_em = null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("Nenhum campo valido para atualizar.");
    }

    try {
      return await prisma.tentativaFormulario.update({
        where: { id },
        data: updateData,
        select: tentativaSelect,
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw error;
      }
      throw new Error(
        error instanceof Error ? error.message : "Erro ao atualizar tentativa."
      );
    }
  }

  async deletarTentativa(id: number, usuarioId: number, cargo: Cargo) {
    const existente = await prisma.tentativaFormulario.findUnique({
      where: { id },
      select: { id: true, usuario_id: true },
    });
    if (!existente) {
      throw new Prisma.PrismaClientKnownRequestError(
        "Record not found",
        { code: "P2025", clientVersion: Prisma.prismaVersion.client }
      );
    }
    if (!podeGerenciarTentativa(cargo, usuarioId, existente.usuario_id)) {
      throw new Error("Acesso negado a esta tentativa.");
    }

    try {
      return await prisma.tentativaFormulario.delete({
        where: { id },
        select: {
          id: true,
          formulario_id: true,
          usuario_id: true,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw error;
      }
      throw new Error(
        error instanceof Error ? error.message : "Erro ao deletar tentativa."
      );
    }
  }
}
