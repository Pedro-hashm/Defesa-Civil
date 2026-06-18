import { parseGeoJsonOrThrow } from "@/lib/geojson";

export function normalizeFideData(
  fide: Record<string, unknown>
): Record<string, unknown> {
  const normalized = { ...fide };
  const geojson = parseGeoJsonOrThrow(normalized.mapa_geojson);

  if (geojson !== undefined) {
    normalized.mapa_geojson = geojson;

    const areaBase =
      typeof normalized.areaPopulacaoAfetada === "object" &&
      normalized.areaPopulacaoAfetada !== null &&
      !Array.isArray(normalized.areaPopulacaoAfetada)
        ? (normalized.areaPopulacaoAfetada as Record<string, unknown>)
        : {};

    normalized.areaPopulacaoAfetada = {
      ...areaBase,
      mapa_selecao: geojson,
      descricao_areas_afetadas:
        (normalized.descricao_areas as string | undefined) ??
        (areaBase.descricao_areas_afetadas as string | undefined),
    };
  }

  return normalized;
}
