import React, { useEffect, useState, useRef } from "react";
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  useMap, 
  useMapsLibrary,
  useAdvancedMarkerRef,
  InfoWindow
} from "@vis.gl/react-google-maps";
import { 
  MapPin, 
  Navigation, 
  Coffee, 
  Loader2, 
  CheckCircle, 
  Settings, 
  Info,
  Route
} from "lucide-react";
import { motion } from "motion/react";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

interface InteractiveMapProps {
  type: "PLACE" | "DIRECTIONS" | "NEARBY";
  query?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  origin?: string;
  destination?: string;
  originLatLng?: { lat: number; lng: number };
  destinationLatLng?: { lat: number; lng: number };
}

// Inner helper component to draw routes
function RouteRenderer({ 
  originLatLng, 
  destinationLatLng,
  onRouteLoaded
}: { 
  originLatLng: { lat: number; lng: number }; 
  destinationLatLng: { lat: number; lng: number };
  onRouteLoaded: (info: { distance: string; duration: string }) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map) return;

    // Clear previous polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    routesLib.Route.computeRoutes({
      origin: originLatLng,
      destination: destinationLatLng,
      travelMode: "DRIVING",
      fields: ["path", "distanceMeters", "durationMillis", "viewport"],
    })
    .then(({ routes }) => {
      if (routes?.[0] && map) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach(p => {
          p.setOptions({
            strokeColor: "#2563EB",
            strokeOpacity: 0.8,
            strokeWeight: 5
          });
          p.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (routes[0].viewport) {
          map.fitBounds(routes[0].viewport);
        }

        const distanceMeters = routes[0].distanceMeters || 0;
        const durationMillis = routes[0].durationMillis || 0;

        const distanceText = (distanceMeters / 1000).toFixed(1) + " km";
        const durationText = Math.round(durationMillis / 60000) + " mins";
        
        onRouteLoaded({ distance: distanceText, duration: durationText });
      }
    })
    .catch((err) => {
      console.error("Route computing failed:", err);
    });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, originLatLng.lat, originLatLng.lng, destinationLatLng.lat, destinationLatLng.lng]);

  return null;
}

// Inner helper component to search for nearby places and render them
function NearbySearchRenderer({
  query,
  center,
  onPlacesFound
}: {
  query: string;
  center: { lat: number; lng: number };
  onPlacesFound: (placesList: google.maps.places.Place[]) => void;
}) {
  const map = useMap();
  const placesLib = useMapsLibrary("places");

  useEffect(() => {
    if (!placesLib || !map || !query) return;

    placesLib.Place.searchByText({
      textQuery: query,
      fields: ["displayName", "location", "formattedAddress", "id"],
      locationBias: center,
      maxResultCount: 6,
    })
    .then(({ places }) => {
      if (places) {
        onPlacesFound(places);
      }
    })
    .catch((err) => {
      console.error("Nearby search failed:", err);
    });
  }, [placesLib, map, query, center.lat, center.lng]);

  return null;
}

// Inner helper component to dynamically geocode custom addresses and center the map on them
function GeocodingRenderer({
  address,
  onCenterResolved
}: {
  address: string;
  onCenterResolved: (coords: { lat: number; lng: number }) => void;
}) {
  const map = useMap();
  const geocodingLib = useMapsLibrary("geocoding");

  useEffect(() => {
    if (!geocodingLib || !map || !address) return;

    const geocoder = new geocodingLib.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        const coords = { lat: loc.lat(), lng: loc.lng() };
        onCenterResolved(coords);
        map.setCenter(coords);
      } else {
        console.warn("Geocoding failed for address:", address, status);
      }
    });
  }, [geocodingLib, map, address, onCenterResolved]);

  return null;
}

export default function InteractiveMap({
  type,
  query,
  center = { lat: 37.42, lng: -122.08 },
  zoom = 13,
  origin,
  destination,
  originLatLng,
  destinationLatLng
}: InteractiveMapProps) {
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<google.maps.places.Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.Place | null>(null);
  const [resolvedCenter, setResolvedCenter] = useState<{ lat: number; lng: number }>(center);

  useEffect(() => {
    setResolvedCenter(center);
  }, [center.lat, center.lng]);

  if (!hasValidKey) {
    return (
      <div className="bg-slate-900 text-slate-100 rounded-xl p-4 border border-slate-800 space-y-3.5 text-xs max-w-full">
        <div className="flex items-center gap-2 text-rose-400 font-bold border-b border-slate-800 pb-2">
          <Settings size={14} className="animate-spin text-rose-500" />
          <span>Interactive Google Map Key Required</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          Google Maps features are ready, but require an API key to load in the browser.
        </p>
        <div className="bg-slate-950 p-3 rounded-lg space-y-2 border border-slate-800">
          <p className="font-semibold text-slate-200">How to activate Google Maps:</p>
          <ul className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
            <li>
              <a 
                href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                Get a free GMP API Key
              </a>
            </li>
            <li>Open the <strong>Settings</strong> panel (⚙️ gear icon, top-right)</li>
            <li>Select <strong>Secrets</strong></li>
            <li>Add secret name: <strong>GOOGLE_MAPS_PLATFORM_KEY</strong></li>
            <li>Paste your key and press Enter. The app will rebuild instantly!</li>
          </ul>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-950/40 p-2 rounded">
          <Info size={11} className="text-blue-400" />
          <span>Showing placeholder maps preview using simulated data coordinates.</span>
        </div>
        
        {/* Placeholder static view simulating map coordinates */}
        <div className="bg-slate-800 border border-slate-700 h-40 rounded-xl flex flex-col items-center justify-center text-center p-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
          <MapPin size={24} className="text-rose-500 animate-bounce mb-2 relative z-10" />
          <span className="font-semibold text-slate-200 relative z-10">
            {type === "DIRECTIONS" ? `${origin} to ${destination}` : query || "Map View"}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 relative z-10">
            {type === "DIRECTIONS" 
              ? `Route: (${originLatLng?.lat.toFixed(2)}°, ${originLatLng?.lng.toFixed(2)}°) → (${destinationLatLng?.lat.toFixed(2)}°, ${destinationLatLng?.lng.toFixed(2)}°)` 
              : `Coords: (${center.lat.toFixed(2)}°, ${center.lng.toFixed(2)}°)`
            }
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col" id={`map-container-${type.toLowerCase()}`}>
      {/* Top Map header bar */}
      <div className="bg-slate-50 border-b border-slate-200 p-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {type === "DIRECTIONS" ? (
            <div className="p-1 bg-blue-100 text-blue-600 rounded">
              <Navigation size={13} />
            </div>
          ) : type === "NEARBY" ? (
            <div className="p-1 bg-amber-100 text-amber-600 rounded">
              <Coffee size={13} />
            </div>
          ) : (
            <div className="p-1 bg-rose-100 text-rose-600 rounded">
              <MapPin size={13} />
            </div>
          )}
          <span className="font-bold text-slate-850">
            {type === "DIRECTIONS" ? "Route Planner" : type === "NEARBY" ? `Nearby: ${query}` : query}
          </span>
        </div>
        {type === "DIRECTIONS" && routeInfo && (
          <span className="font-mono text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-bold">
            {routeInfo.distance} ({routeInfo.duration})
          </span>
        )}
      </div>

      <div style={{ width: "100%", height: "240px", position: "relative" }}>
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            center={type === "DIRECTIONS" ? originLatLng : resolvedCenter}
            defaultZoom={zoom}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            style={{ width: "100%", height: "100%" }}
            gestureHandling="cooperative"
            disableDefaultUI={true}
          >
            {type === "PLACE" && (
              <>
                <AdvancedMarker position={resolvedCenter} title={query}>
                  <Pin background="#E11D48" glyphColor="#fff" />
                </AdvancedMarker>
                <GeocodingRenderer 
                  address={query || ""} 
                  onCenterResolved={(coords) => setResolvedCenter(coords)} 
                />
              </>
            )}

            {type === "DIRECTIONS" && originLatLng && destinationLatLng && (
              <>
                <AdvancedMarker position={originLatLng} title={origin}>
                  <Pin background="#10B981" glyphColor="#fff" />
                </AdvancedMarker>
                <AdvancedMarker position={destinationLatLng} title={destination}>
                  <Pin background="#2563EB" glyphColor="#fff" />
                </AdvancedMarker>
                <RouteRenderer 
                  originLatLng={originLatLng} 
                  destinationLatLng={destinationLatLng} 
                  onRouteLoaded={(info) => setRouteInfo(info)}
                />
              </>
            )}

            {type === "NEARBY" && center && (
              <>
                <AdvancedMarker position={center} title="Your Location">
                  <Pin background="#E11D48" glyphColor="#fff" scale={1.1} />
                </AdvancedMarker>
                <NearbySearchRenderer 
                  query={query || ""} 
                  center={center} 
                  onPlacesFound={(places) => setNearbyPlaces(places)}
                />
                {nearbyPlaces.map((place) => (
                  <AdvancedMarker 
                    key={place.id} 
                    position={place.location} 
                    title={place.displayName || ""}
                    onClick={() => setSelectedPlace(place)}
                  >
                    <Pin background="#F59E0B" glyphColor="#fff" scale={0.9} />
                  </AdvancedMarker>
                ))}
                {selectedPlace && selectedPlace.location && (
                  <InfoWindow 
                    position={selectedPlace.location} 
                    onCloseClick={() => setSelectedPlace(null)}
                  >
                    <div className="p-1 text-slate-800 max-w-xs">
                      <p className="font-bold text-xs">{selectedPlace.displayName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{selectedPlace.formattedAddress}</p>
                    </div>
                  </InfoWindow>
                )}
              </>
            )}
          </Map>
        </APIProvider>
      </div>

      {type === "NEARBY" && nearbyPlaces.length > 0 && (
        <div className="p-2 bg-slate-50 border-t border-slate-200 flex gap-2 overflow-x-auto">
          {nearbyPlaces.slice(0, 3).map((place, i) => (
            <button
              key={place.id || i}
              onClick={() => setSelectedPlace(place)}
              className="text-[10px] bg-white border border-slate-200 hover:border-amber-400 p-1.5 rounded-lg flex-shrink-0 text-left w-36 transition-colors cursor-pointer shadow-3xs"
            >
              <p className="font-bold text-slate-700 truncate">{place.displayName}</p>
              <p className="text-[9px] text-slate-400 truncate mt-0.5">{place.formattedAddress}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
