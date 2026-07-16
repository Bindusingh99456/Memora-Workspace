import React, { useState, useEffect } from "react";
import { 
  Sun, 
  Cloud, 
  CloudSun, 
  CloudRain, 
  CloudDrizzle, 
  CloudSnow, 
  CloudLightning, 
  Wind, 
  Droplets, 
  Thermometer, 
  Loader2,
  Calendar,
  Compass,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";

interface WeatherWidgetProps {
  city: string;
  latitude: number;
  longitude: number;
}

interface WeatherData {
  currentTemp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  daily: Array<{
    date: string;
    weatherCode: number;
    tempMax: number;
    tempMin: number;
    rainProb: number;
  }>;
}

export default function WeatherWidget({ city, latitude, longitude }: WeatherWidgetProps) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error("Could not fetch weather forecast data.");
        
        const json = await res.json();
        
        if (!active) return;

        // Process daily data (next 3 days)
        const dailyForecast = [];
        for (let i = 0; i < 3; i++) {
          if (json.daily && json.daily.time[i]) {
            dailyForecast.push({
              date: new Date(json.daily.time[i]).toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }),
              weatherCode: json.daily.weather_code[i],
              tempMax: Math.round(json.daily.temperature_2m_max[i]),
              tempMin: Math.round(json.daily.temperature_2m_min[i]),
              rainProb: json.daily.precipitation_probability_max[i] || 0,
            });
          }
        }

        setData({
          currentTemp: Math.round(json.current.temperature_2m),
          feelsLike: Math.round(json.current.apparent_temperature),
          humidity: json.current.relative_humidity_2m,
          windSpeed: Math.round(json.current.wind_speed_10m),
          weatherCode: json.current.weather_code,
          daily: dailyForecast
        });
      } catch (err: any) {
        if (active) {
          setError(err.message || "Failed to load weather.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchWeather();
    return () => {
      active = false;
    };
  }, [latitude, longitude]);

  const getWeatherIcon = (code: number, size = 24) => {
    // WMO Weather Codes mapping
    if (code === 0) return <Sun size={size} className="text-amber-500 animate-spin-slow" />;
    if (code >= 1 && code <= 3) return <CloudSun size={size} className="text-sky-400" />;
    if (code === 45 || code === 48) return <Cloud size={size} className="text-slate-400" />;
    if (code >= 51 && code <= 55) return <CloudDrizzle size={size} className="text-teal-400" />;
    if (code >= 61 && code <= 65) return <CloudRain size={size} className="text-blue-500 animate-bounce-subtle" />;
    if (code >= 71 && code <= 77) return <CloudSnow size={size} className="text-sky-200 animate-pulse" />;
    if (code >= 80 && code <= 82) return <CloudRain size={size} className="text-blue-600 animate-bounce-subtle" />;
    if (code >= 95) return <CloudLightning size={size} className="text-purple-500" />;
    return <CloudSun size={size} className="text-slate-500" />;
  };

  const getWeatherDescription = (code: number) => {
    if (code === 0) return "Clear Sky";
    if (code === 1) return "Mainly Clear";
    if (code === 2) return "Partly Cloudy";
    if (code === 3) return "Overcast";
    if (code === 45 || code === 48) return "Foggy";
    if (code >= 51 && code <= 55) return "Drizzle";
    if (code >= 61 && code <= 65) return "Raining";
    if (code >= 71 && code <= 77) return "Snowing";
    if (code >= 80 && code <= 82) return "Showers";
    if (code >= 95) return "Thunderstorm";
    return "Partly Cloudy";
  };

  if (loading) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[140px] text-slate-500">
        <Loader2 size={18} className="animate-spin text-blue-600 mb-2" />
        <span className="text-[11px] font-medium font-mono">Fetching Weather for {city}...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-150 rounded-xl p-4 flex items-start gap-2.5 text-rose-800 text-xs">
        <AlertCircle size={14} className="text-rose-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Weather Forecast Offline</p>
          <p className="text-[10px] text-rose-600">{error || "Could not retrieve weather details."}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-50 to-blue-50/20 border border-slate-200 rounded-xl p-4 shadow-xs space-y-3"
      id={`weather-widget-${city.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex justify-between items-start border-b border-slate-200/60 pb-2.5">
        <div>
          <span className="text-[9px] font-mono font-bold text-blue-600 uppercase tracking-wider block">Live Forecast</span>
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <Compass size={11} className="text-blue-500 animate-spin-slow" /> {city}
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">Coords: {latitude.toFixed(2)}°, {longitude.toFixed(2)}°</span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{data.currentTemp}°C</span>
          <span className="text-[10px] text-slate-500 block">Feels like {data.feelsLike}°C</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white border border-slate-150 rounded-lg p-2 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Condition</span>
          <div className="my-1">{getWeatherIcon(data.weatherCode, 18)}</div>
          <span className="text-[10px] font-semibold text-slate-700 truncate max-w-full">{getWeatherDescription(data.weatherCode)}</span>
        </div>
        <div className="bg-white border border-slate-150 rounded-lg p-2 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Humidity</span>
          <div className="my-1 text-sky-500"><Droplets size={16} /></div>
          <span className="text-[10px] font-semibold text-slate-700">{data.humidity}%</span>
        </div>
        <div className="bg-white border border-slate-150 rounded-lg p-2 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Wind Speed</span>
          <div className="my-1 text-teal-500"><Wind size={16} /></div>
          <span className="text-[10px] font-semibold text-slate-700">{data.windSpeed} km/h</span>
        </div>
      </div>

      {/* 3-day forecast details */}
      <div className="pt-1 space-y-1.5">
        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">3-Day Trend</span>
        <div className="space-y-1">
          {data.daily.map((day, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white/60 border border-slate-150/50 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-600 hover:bg-white transition-colors">
              <span className="font-semibold text-slate-700 w-20">{day.date}</span>
              <div className="flex items-center gap-1.5 justify-center flex-1">
                {getWeatherIcon(day.weatherCode, 13)}
                <span className="text-[10px] text-slate-500">{getWeatherDescription(day.weatherCode)}</span>
              </div>
              <div className="text-right flex items-center gap-1 w-20 justify-end">
                <span className="font-bold text-slate-800">{day.tempMax}°</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-400">{day.tempMin}°</span>
                {day.rainProb > 20 && (
                  <span className="text-[9px] text-blue-500 font-mono font-semibold ml-1">({day.rainProb}%)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
