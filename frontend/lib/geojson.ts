export function ensureClosedRing(ring: number[][]): number[][] {
  if (ring.length < 3) return ring;
  const [firstLng, firstLat] = ring[0];
  const [lastLng, lastLat] = ring[ring.length - 1];
  if (firstLng === lastLng && firstLat === lastLat) return ring;
  return [...ring, [firstLng, firstLat]];
}

export function parseGeoJsonToLatLngs(geojson: string): [number, number][][] {
  if (!geojson) return [];
  try {
    const parsed = JSON.parse(geojson) as {
      type?: string;
      features?: Array<{
        geometry?: { type?: string; coordinates?: number[][][] };
      }>;
    };
    if (parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
      return [];
    }
    return parsed.features
      .filter((f) => f.geometry?.type === "Polygon")
      .map((f) => {
        const ring = f.geometry?.coordinates?.[0] ?? [];
        return ring
          .filter((c) => Array.isArray(c) && c.length >= 2)
          .map((c) => [Number(c[1]), Number(c[0])] as [number, number])
          .filter(([lat, lng]) => isFinite(lat) && isFinite(lng));
      })
      .filter((path) => path.length >= 3);
  } catch {
    return [];
  }
}

export function parseGeoJsonOrThrow(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      throw new Error("Mapa invalido: nao foi possivel ler o GeoJSON.");
    }
  }

  return value;
}
