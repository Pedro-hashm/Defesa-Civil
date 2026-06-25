import { describe, expect, it } from "vitest";
import {
  ensureClosedRing,
  parseGeoJsonOrThrow,
  parseGeoJsonToLatLngs,
} from "../geojson";

describe("geojson", () => {
  describe("ensureClosedRing", () => {
    it("fecha anel aberto repetindo o primeiro ponto", () => {
      const ring = [
        [-34.9, -8.1],
        [-34.8, -8.1],
        [-34.8, -8.2],
      ];
      const fechado = ensureClosedRing(ring);
      expect(fechado).toHaveLength(4);
      expect(fechado[3]).toEqual([-34.9, -8.1]);
    });

    it("mantem anel ja fechado", () => {
      const ring = [
        [-34.9, -8.1],
        [-34.8, -8.1],
        [-34.8, -8.2],
        [-34.9, -8.1],
      ];
      expect(ensureClosedRing(ring)).toEqual(ring);
    });
  });

  describe("parseGeoJsonToLatLngs", () => {
    it("converte FeatureCollection em lat/lng", () => {
      const geojson = JSON.stringify({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [-34.9, -8.1],
                  [-34.8, -8.1],
                  [-34.8, -8.2],
                  [-34.9, -8.1],
                ],
              ],
            },
          },
        ],
      });

      const paths = parseGeoJsonToLatLngs(geojson);
      expect(paths).toHaveLength(1);
      expect(paths[0][0]).toEqual([-8.1, -34.9]);
    });

    it("retorna vazio para json invalido", () => {
      expect(parseGeoJsonToLatLngs("")).toEqual([]);
      expect(parseGeoJsonToLatLngs("{invalido")).toEqual([]);
    });
  });

  describe("parseGeoJsonOrThrow", () => {
    it("retorna undefined para valores vazios", () => {
      expect(parseGeoJsonOrThrow(null)).toBeUndefined();
      expect(parseGeoJsonOrThrow("")).toBeUndefined();
    });

    it("faz parse de string json", () => {
      const obj = { type: "FeatureCollection", features: [] };
      expect(parseGeoJsonOrThrow(JSON.stringify(obj))).toEqual(obj);
    });

    it("lanca erro para string invalida", () => {
      expect(() => parseGeoJsonOrThrow("{nao-json")).toThrow(
        "Mapa invalido: nao foi possivel ler o GeoJSON."
      );
    });
  });
});
