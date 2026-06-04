"use client";

import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type AffectedAreasMapProps = {
    value?: string;
    onChange: (geojson: string) => void;
};

const DEFAULT_CENTER: [number, number] = [-8.0476, -34.877];
const DEFAULT_ZOOM = 11;

const POLYGON_STYLE = {
    color: "#003882",
    fillColor: "#003882",
    fillOpacity: 0.2,
    weight: 2,
    opacity: 0.95,
};

function ensureClosedRing(ring: number[][]): number[][] {
    if (ring.length < 3) return ring;
    const [firstLng, firstLat] = ring[0];
    const [lastLng, lastLat] = ring[ring.length - 1];
    if (firstLng === lastLng && firstLat === lastLat) return ring;
    return [...ring, [firstLng, firstLat]];
}

function parseGeoJsonToLatLngs(geojson: string): [number, number][][] {
    if (!geojson) return [];
    try {
        const parsed = JSON.parse(geojson) as {
            type?: string;
            features?: Array<{
                geometry?: { type?: string; coordinates?: number[][][] };
            }>;
        };
        if (parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) return [];
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

export default function AffectedAreasMap({ value = "", onChange }: AffectedAreasMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<import("leaflet").Map | null>(null);
    const polygonsRef = useRef<import("leaflet").Polygon[]>([]);
    const onChangeRef = useRef(onChange);
    const initialValueRef = useRef(value);
    const hasHydratedRef = useRef(false);
    const [isReady, setIsReady] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const syncAndEmit = useCallback(() => {
        const features = polygonsRef.current
            .map((polygon) => {
                const latlngs = (polygon.getLatLngs()[0] ?? []) as Array<{
                    lat: number;
                    lng: number;
                }>;
                if (latlngs.length < 3) return null;
                const coords = latlngs.map((ll) => [ll.lng, ll.lat]);
                return {
                    type: "Feature" as const,
                    properties: {},
                    geometry: {
                        type: "Polygon" as const,
                        coordinates: [ensureClosedRing(coords)],
                    },
                };
            })
            .filter(Boolean);

        onChangeRef.current(JSON.stringify({ type: "FeatureCollection", features }));
    }, []);

    const polygonCount = useMemo(() => parseGeoJsonToLatLngs(value).length, [value]);

    const clearOverlays = useCallback(() => {
        polygonsRef.current.forEach((p) => p.remove());
        polygonsRef.current = [];
        hasHydratedRef.current = true;
        syncAndEmit();
        setSaveMessage("Selecao limpa.");
    }, [syncAndEmit]);

    const handleSaveSelection = useCallback(() => {
        syncAndEmit();
        setSaveMessage("Selecao salva no formulario.");
    }, [syncAndEmit]);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        let cancelled = false;

        const init = async () => {
            const L = (await import("leaflet")).default;
            await import("@geoman-io/leaflet-geoman-free");

            if (cancelled || !containerRef.current) return;

            const map = L.map(containerRef.current, {
                center: DEFAULT_CENTER,
                zoom: DEFAULT_ZOOM,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
            }).addTo(map);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pm = (map as any).pm;

            pm.addControls({
                position: "topright",
                drawPolygon: true,
                drawMarker: false,
                drawCircle: false,
                drawPolyline: false,
                drawRectangle: false,
                drawCircleMarker: false,
                drawText: false,
                editMode: true,
                dragMode: false,
                cutPolygon: false,
                removalMode: true,
                rotateMode: false,
            });

            pm.setPathOptions(POLYGON_STYLE);

            const addLayerListeners = (layer: import("leaflet").Polygon) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (layer as any).on("pm:edit", () => syncAndEmit());
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (layer as any).on("pm:remove", () => {
                    polygonsRef.current = polygonsRef.current.filter((p) => p !== layer);
                    syncAndEmit();
                });
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            map.on("pm:create", ({ layer }: any) => {
                const polygon = layer as import("leaflet").Polygon;
                polygonsRef.current.push(polygon);
                addLayerListeners(polygon);
                syncAndEmit();
            });

            if (initialValueRef.current && !hasHydratedRef.current) {
                const paths = parseGeoJsonToLatLngs(initialValueRef.current);
                paths.forEach((path) => {
                    const polygon = L.polygon(path, POLYGON_STYLE).addTo(map);
                    addLayerListeners(polygon);
                    polygonsRef.current.push(polygon);
                });
                hasHydratedRef.current = true;
            }

            mapRef.current = map;
            setIsReady(true);
        };

        init().catch(console.error);

        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                polygonsRef.current = [];
                hasHydratedRef.current = false;
                setIsReady(false);
            }
        };
        // map init runs once on mount only
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
                <p>
                    Use a ferramenta de poligono para desenhar as areas afetadas. Use o modo de remocao para excluir uma area.
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={clearOverlays}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                    >
                        Limpar selecao
                    </button>

                    <button
                        type="button"
                        onClick={handleSaveSelection}
                        className="inline-flex items-center justify-center rounded border border-pe-blue bg-pe-blue px-3 py-1.5 font-semibold text-white transition-colors hover:bg-pe-blue-dark"
                    >
                        Salvar selecao
                    </button>
                </div>
            </div>

            <div className="relative overflow-hidden rounded border border-slate-300">
                {!isReady && (
                    <div className="absolute inset-0 animate-pulse bg-slate-200" />
                )}
                <div ref={containerRef} style={{ width: "100%", height: "22rem" }} />
            </div>

            <p className="text-xs text-slate-500">
                Areas mapeadas: <strong>{polygonCount}</strong>
            </p>

            {saveMessage && <p className="text-xs text-emerald-700">{saveMessage}</p>}
        </div>
    );
}
