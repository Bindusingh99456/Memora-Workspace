import React from "react";
import { 
  MapPin, 
  Navigation, 
  Compass, 
  RefreshCw, 
  Trash2, 
  Info,
  ExternalLink
} from "lucide-react";
import { motion } from "motion/react";
import WeatherWidget from "./WeatherWidget";

interface GpsLocationCardProps {
  gpsLocation: {
    latitude: number;
    longitude: number;
    city?: string;
    address?: string;
    timestamp?: string;
  } | null;
  gpsLoading: boolean;
  onFetchGps: () => void;
  onClearGps: () => void;
}

export default function GpsLocationCard({
  gpsLocation,
  gpsLoading,
  onFetchGps,
  onClearGps
}: GpsLocationCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4" id="gps-location-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Compass size={18} className={gpsLoading ? "animate-spin" : ""} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Real-Time Geolocation</h3>
            <p className="text-[10px] text-slate-400 font-mono">GPS COORDINATES & LOCAL CONTEXT</p>
          </div>
        </div>

        {gpsLocation && (
          <button
            onClick={onClearGps}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Reset GPS location data"
            id="gps-reset-btn"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {!gpsLocation ? (
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-center space-y-3.5">
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <MapPin size={20} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-700">GPS Location Access</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
              Enable GPS to automatically detect your local coordinates, view instant weather forecasts, and feed timezone/geographical context to Memora AI.
            </p>
          </div>
          <button
            onClick={onFetchGps}
            disabled={gpsLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            id="gps-enable-btn"
          >
            {gpsLoading ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Locating Workspace...</span>
              </>
            ) : (
              <>
                <Navigation size={13} />
                <span>Sync GPS Location</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Detected Address Panel */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 space-y-2">
            <div className="flex items-start gap-2.5">
              <MapPin className="text-blue-600 shrink-0 mt-0.5" size={15} />
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {gpsLocation.city || "Detected Location"}
                </p>
                <p className="text-[10px] text-slate-500 leading-normal break-words" title={gpsLocation.address}>
                  {gpsLocation.address}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span>LAT: {gpsLocation.latitude.toFixed(5)}</span>
              <span>LNG: {gpsLocation.longitude.toFixed(5)}</span>
            </div>
          </div>

          {/* Connected Weather Component */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Local Weather Forecast</span>
              <span className="text-[9px] text-slate-400 font-mono">
                Updated: {new Date(gpsLocation.timestamp || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <WeatherWidget 
              city={gpsLocation.city || "GPS Location"} 
              latitude={gpsLocation.latitude} 
              longitude={gpsLocation.longitude} 
            />
          </div>

          <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5">
            <Info className="text-emerald-600 shrink-0 mt-0.5" size={13} />
            <p className="text-[10.5px] text-slate-600 leading-relaxed">
              <strong>AI Context Active:</strong> Memora AI now knows your exact location is <span className="font-semibold">{gpsLocation.city}</span>. Your natural chat requests about scheduling, weather, and distance will utilize these GPS constraints automatically!
            </p>
          </div>

          <button
            onClick={onFetchGps}
            disabled={gpsLoading}
            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 text-[10.5px] font-medium rounded-lg border border-slate-200 cursor-pointer transition-all"
            id="gps-re-sync-btn"
          >
            <RefreshCw size={11} className={gpsLoading ? "animate-spin" : ""} />
            <span>Update GPS Location</span>
          </button>
        </div>
      )}
    </div>
  );
}
