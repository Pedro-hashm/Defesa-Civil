"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import { DrawingManager, GoogleMap, Libraries, useJsApiLoader } from "@react-google-maps/api";

type AffectedAreasMapProps = {
    value?: string;
    onChange: (geojson: string) => void;
};

const libraries: Libraries = ["drawing"];

const mapContainerStyle = {
    width: "100%",
    height: "22rem",
};

const defaultCenter: google.maps.LatLngLiteral = {
    lat: -8.0476,
    lng: -34.877,
};

function ensureClosedRing(ring: number[][]): number[][] {
    if (ring.length < 3) {
        return ring;
    }

    const [firstLng, firstLat] = ring[0];
    const [lastLng, lastLat] = ring[ring.length - 1];

    if (firstLng === lastLng && firstLat === lastLat) {
        return ring;
    }

    return [...ring, [firstLng, firstLat]];
}

function overlaysToGeoJson(overlays: google.maps.Polygon[]): string {
    const features = overlays
        .map((polygon) => {
            const path = polygon
                .getPath()
                .getArray()
                .map((point) => [point.lng(), point.lat()]);

            if (path.length < 3) {
                return null;
            }

            return {
                type: "Feature",
                properties: {},
                geometry: {
                    type: "Polygon",
                    coordinates: [ensureClosedRing(path)],
                },
            };
        })
        .filter(Boolean);

    return JSON.stringify({
        type: "FeatureCollection",
        features,
    });
}

function parseGeoJsonPaths(geojson: string): google.maps.LatLngLiteral[][] {
    if (!geojson) {
        return [];
    }

    try {
        const parsed = JSON.parse(geojson) as {
            type?: string;
            features?: Array<{
                geometry?: {
                    type?: string;
                    coordinates?: number[][][];
                };
            }>;
        };

        if (parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
            return [];
        }

        return parsed.features
            .filter((feature) => feature.geometry?.type === "Polygon")
            .map((feature) => {
                const firstRing = feature.geometry?.coordinates?.[0] ?? [];
                return firstRing
                    .filter((coord) => Array.isArray(coord) && coord.length >= 2)
                    .map((coord) => ({ lat: Number(coord[1]), lng: Number(coord[0]) }))
                    .filter((coord) => Number.isFinite(coord.lat) && Number.isFinite(coord.lng));
            })
            .filter((path) => path.length >= 3)
            .map((path) => {
                const first = path[0];
                const last = path[path.length - 1];

                if (first.lat === last.lat && first.lng === last.lng) {
                    return path.slice(0, -1);
                }

                return path;
            });
    } catch {
        return [];
    }
}

export default function AffectedAreasMap({ value = "", onChange }: AffectedAreasMapProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
    const mapRef = useRef<google.maps.Map | null>(null);
    const overlaysRef = useRef<google.maps.Polygon[]>([]);
    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
    const hasHydratedFromValueRef = useRef(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-maps-fide-loader",
        googleMapsApiKey: apiKey,
        libraries,
    });

    const polygonCount = useMemo(() => parseGeoJsonPaths(value).length, [value]);

    const syncAndEmit = useCallback(() => {
        const geojson = overlaysToGeoJson(overlaysRef.current);
        onChange(geojson);
    }, [onChange]);

    const attachPolygonListeners = useCallback(
        (polygon: google.maps.Polygon) => {
            const path = polygon.getPath();

            path.addListener("insert_at", syncAndEmit);
            path.addListener("set_at", syncAndEmit);
            path.addListener("remove_at", syncAndEmit);

            polygon.addListener("rightclick", () => {
                polygon.setMap(null);
                overlaysRef.current = overlaysRef.current.filter((item) => item !== polygon);
                syncAndEmit();
            });
        },
        [syncAndEmit],
    );

    const createPolygon = useCallback(
        (path: google.maps.LatLngLiteral[]) => {
            if (!mapRef.current) {
                return null;
            }

            const polygon = new google.maps.Polygon({
                paths: path,
                map: mapRef.current,
                editable: true,
                draggable: false,
                strokeColor: "#003882",
                strokeOpacity: 0.95,
                strokeWeight: 2,
                fillColor: "#003882",
                fillOpacity: 0.2,
            });

            attachPolygonListeners(polygon);
            overlaysRef.current.push(polygon);

            return polygon;
        },
        [attachPolygonListeners],
    );

    const clearOverlays = useCallback(() => {
        overlaysRef.current.forEach((overlay) => overlay.setMap(null));
        overlaysRef.current = [];
        hasHydratedFromValueRef.current = true;
        syncAndEmit();
        setSaveMessage("Selecao limpa.");
    }, [syncAndEmit]);

    const handleSaveSelection = useCallback(() => {
        syncAndEmit();
        setSaveMessage("Selecao salva no formulario.");
    }, [syncAndEmit]);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const onPolygonComplete = useCallback(
        (polygon: google.maps.Polygon) => {
            attachPolygonListeners(polygon);
            overlaysRef.current.push(polygon);

            if (drawingManagerRef.current) {
                drawingManagerRef.current.setDrawingMode(null);
            }

            syncAndEmit();
        },
        [attachPolygonListeners, syncAndEmit],
    );

    useEffect(() => {
        if (!isLoaded || !mapRef.current || hasHydratedFromValueRef.current) {
            return;
        }

        const initialPaths = parseGeoJsonPaths(value);

        if (initialPaths.length > 0) {
            initialPaths.forEach((path) => {
                createPolygon(path);
            });
        }

        hasHydratedFromValueRef.current = true;
    }, [createPolygon, isLoaded, value]);

    if (!apiKey) {
        return (
            <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Defina NEXT_PUBLIC_GOOGLE_MAPS_API_KEY para habilitar o mapa interativo.
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Nao foi possivel carregar o Google Maps. Verifique a chave da API e as restricoes de dominio.
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="h-80 w-full animate-pulse rounded border border-slate-300 bg-slate-200" />
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
                <p>
                    Use a ferramenta de poligono para desenhar as areas afetadas. Clique com o botao direito em uma area para remover.
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

            <div className="overflow-hidden rounded border border-slate-300">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={defaultCenter}
                    zoom={11}
                    onLoad={onMapLoad}
                    options={{
                        streetViewControl: false,
                        fullscreenControl: false,
                        mapTypeControl: true,
                    }}
                >
                    <DrawingManager
                        onLoad={(manager) => {
                            drawingManagerRef.current = manager;
                        }}
                        options={{
                            drawingControl: true,
                            drawingControlOptions: {
                                position: google.maps.ControlPosition.TOP_CENTER,
                                drawingModes: [google.maps.drawing.OverlayType.POLYGON],
                            },
                            polygonOptions: {
                                editable: true,
                                draggable: false,
                                strokeColor: "#003882",
                                strokeOpacity: 0.95,
                                strokeWeight: 2,
                                fillColor: "#003882",
                                fillOpacity: 0.2,
                            },
                        }}
                        onPolygonComplete={onPolygonComplete}
                    />
                </GoogleMap>
            </div>

            <p className="text-xs text-slate-500">
                Areas mapeadas: <strong>{polygonCount}</strong>
            </p>

            {saveMessage && (
                <p className="text-xs text-emerald-700">{saveMessage}</p>
            )}
        </div>
    );
}
