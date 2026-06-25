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

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isClosedLinearRing(ring: unknown[]): boolean {
  if (ring.length < 4) {
    return false;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];

  if (!Array.isArray(first) || !Array.isArray(last) || first.length < 2 || last.length < 2) {
    return false;
  }

  return Number(first[0]) === Number(last[0]) && Number(first[1]) === Number(last[1]);
}

function assertLngLat(position: unknown) {
  if (!Array.isArray(position) || position.length < 2) {
    throw new Error("GeoJSON invalido: coordenada deve ter [lng, lat].");
  }

  const lng = Number(position[0]);
  const lat = Number(position[1]);

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    throw new Error("GeoJSON invalido: coordenadas devem ser numericas.");
  }

  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    throw new Error("GeoJSON invalido: coordenadas fora do intervalo permitido.");
  }
}

function assertPolygonCoordinates(coords: unknown) {
  if (!Array.isArray(coords) || coords.length === 0) {
    throw new Error("GeoJSON invalido: Polygon sem aneis.");
  }

  coords.forEach((ring) => {
    if (!Array.isArray(ring)) {
      throw new Error("GeoJSON invalido: anel do Polygon malformado.");
    }

    ring.forEach(assertLngLat);

    if (!isClosedLinearRing(ring)) {
      throw new Error("GeoJSON invalido: o poligono deve estar fechado.");
    }
  });
}

function assertGeometry(geometry: unknown) {
  if (!isRecord(geometry)) {
    throw new Error("GeoJSON invalido: geometria ausente.");
  }

  const type = geometry.type;
  const coordinates = geometry.coordinates;

  if (type === "Polygon") {
    assertPolygonCoordinates(coordinates);
    return;
  }

  if (type === "MultiPolygon") {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      throw new Error("GeoJSON invalido: MultiPolygon sem coordenadas.");
    }

    coordinates.forEach(assertPolygonCoordinates);
    return;
  }

  throw new Error("GeoJSON invalido: somente Polygon e MultiPolygon sao suportados.");
}

function parseAndValidateGeoJson(value: unknown): Prisma.InputJsonValue {
  const parsed =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value) as unknown;
          } catch {
            throw new Error("GeoJSON invalido: nao foi possivel interpretar o JSON.");
          }
        })()
      : value;

  if (!isRecord(parsed) || parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
    throw new Error("GeoJSON invalido: esperado FeatureCollection.");
  }

  if (parsed.features.length === 0) {
    throw new Error("GeoJSON invalido: informe ao menos uma area afetada.");
  }

  parsed.features.forEach((feature) => {
    if (!isRecord(feature)) {
      throw new Error("GeoJSON invalido: feature malformada.");
    }

    assertGeometry(feature.geometry);
  });

  return parsed as Prisma.InputJsonValue;
}

function normalizarRespostasComMapa(respostas: unknown): Prisma.InputJsonValue {
  if (!isRecord(respostas)) {
    return respostas as Prisma.InputJsonValue;
  }

  const clone = JSON.parse(JSON.stringify(respostas)) as JsonRecord;

  const fide = isRecord(clone.fide) ? clone.fide : undefined;
  const areaFide = fide && isRecord(fide.areaPopulacaoAfetada) ? fide.areaPopulacaoAfetada : undefined;

  const directArea = isRecord(clone.areaPopulacaoAfetada) ? clone.areaPopulacaoAfetada : undefined;

  const candidate =
    (fide?.mapa_geojson as unknown) ??
    (areaFide?.mapa_selecao as unknown) ??
    (clone.mapa_geojson as unknown) ??
    (directArea?.mapa_selecao as unknown);

  if (candidate === undefined || candidate === null || candidate === "") {
    return clone as Prisma.InputJsonValue;
  }

  const geojson = parseAndValidateGeoJson(candidate);

  if (fide) {
    fide.mapa_geojson = geojson;
    const area = isRecord(fide.areaPopulacaoAfetada)
      ? fide.areaPopulacaoAfetada
      : {};
    area.mapa_selecao = geojson;
    fide.areaPopulacaoAfetada = area;
    clone.fide = fide;
  } else {
    clone.mapa_geojson = geojson;
    const area = isRecord(clone.areaPopulacaoAfetada)
      ? clone.areaPopulacaoAfetada
      : {};
    area.mapa_selecao = geojson;
    clone.areaPopulacaoAfetada = area;
  }

  return clone as Prisma.InputJsonValue;
}

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
    const respostasNormalizadas = normalizarRespostasComMapa(data.respostas);

    const form = await prisma.formulario.findFirst({
      where: { id: data.formulario_id, ativo: true },
    });
    if (!form) {
      throw new Error("Formulario nao encontrado ou inativo.");
    }

    // 🔥 CORREÇÃO: O fallback agora é INICIADO, garantindo coerência se o front não enviar o status
    const status = data.status ?? StatusTentativa.INICIADO;
    const agora = new Date();

    return prisma.tentativaFormulario.create({
      data: {
        usuario_id: usuarioId,
        formulario_id: data.formulario_id,
        respostas: respostasNormalizadas,
        erros:
          data.erros === undefined
            ? undefined
            : data.erros === null
              ? Prisma.JsonNull
              : (data.erros as Prisma.InputJsonValue),
        status,
        // Só injeta a data de finalizado_em se o status for explícito para FINALIZADO
        finalizado_em: status === StatusTentativa.FINALIZADO ? agora : null,
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

  async listarTentativasSupervisor() {
    return prisma.tentativaFormulario.findMany({
      where: {},
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
      updateData.respostas = normalizarRespostasComMapa(data.respostas);
    }
    
    if (data.erros !== undefined) {
      // Aceita string bruta (feedback do supervisor) ou JSON
      updateData.erros =
        data.erros === null
          ? Prisma.JsonNull
          : (data.erros as Prisma.InputJsonValue);
    }
    
    if (data.status !== undefined) {
      updateData.status = data.status;
      // Garante que a data de finalização mude conforme o status (Aprovação ou Retorno)
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