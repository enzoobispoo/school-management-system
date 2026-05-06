"use client";

import { useEffect, useState } from "react";

interface DashboardGreetingProps {
  name?: string;
}

function getGreeting(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function getSubtitle(hour: number) {
  if (hour < 12)
    return "Comece pelas operações urgentes e pelos indicadores que mais impactam caixa e ocupação.";
  if (hour < 18)
    return "Use a central de operações para priorizar cobrança, turmas e acompanhamento acadêmico.";
  return "Feche o dia conferindo pendências financeiras e movimentações recentes.";
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getWeatherInfo(code: number, isDay: boolean): { label: string; icon: React.ReactNode } {
  if (code === 0) return { label: "Céu limpo", icon: isDay ? <SunIcon /> : <MoonIcon /> };
  if (code <= 2)  return { label: "Poucas nuvens", icon: <PartlyCloudyIcon isDay={isDay} /> };
  if (code === 3) return { label: "Nublado", icon: <CloudIcon /> };
  if (code <= 49) return { label: "Névoa", icon: <FogIcon /> };
  if (code <= 59) return { label: "Garoa", icon: <DrizzleIcon /> };
  if (code <= 69) return { label: "Chuva", icon: <RainIcon /> };
  if (code <= 79) return { label: "Neve", icon: <SnowIcon /> };
  if (code <= 84) return { label: "Pancadas de chuva", icon: <RainIcon /> };
  if (code <= 99) return { label: "Tempestade", icon: <ThunderIcon /> };
  return { label: "—", icon: <CloudIcon /> };
}

function SunIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="10" fill="#FCD34D" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <line key={i} x1="24" y1="6" x2="24" y2="10"
          stroke="#FCD34D" strokeWidth="2.5" strokeLinecap="round"
          transform={`rotate(${deg} 24 24)`} />
      ))}
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M30 14a14 14 0 1 1-14 14 10 10 0 0 0 14-14z" fill="#93C5FD" />
    </svg>
  );
}

function PartlyCloudyIcon({ isDay }: { isDay: boolean }) {
  return (
    <svg width="52" height="48" viewBox="0 0 52 48" fill="none">
      {isDay ? (
        <>
          <circle cx="18" cy="18" r="8" fill="#FCD34D" />
          {[0,60,120,180,240,300].map((deg, i) => (
            <line key={i} x1="18" y1="6" x2="18" y2="9"
              stroke="#FCD34D" strokeWidth="2" strokeLinecap="round"
              transform={`rotate(${deg} 18 18)`} />
          ))}
        </>
      ) : (
        <path d="M22 10a10 10 0 1 1-10 10 7 7 0 0 0 10-10z" fill="#93C5FD" />
      )}
      <rect x="10" y="26" width="32" height="14" rx="7" fill="white" fillOpacity="0.85" />
      <rect x="16" y="20" width="22" height="12" rx="6" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg width="52" height="40" viewBox="0 0 52 40" fill="none">
      <rect x="4" y="18" width="44" height="18" rx="9" fill="white" fillOpacity="0.7" />
      <rect x="12" y="10" width="28" height="16" rx="8" fill="white" fillOpacity="0.85" />
    </svg>
  );
}

function FogIcon() {
  return (
    <svg width="52" height="40" viewBox="0 0 52 40" fill="none">
      {[8, 18, 28].map((y, i) => (
        <rect key={i} x={i === 1 ? 4 : 8} y={y} width={i === 1 ? 44 : 36} height="4" rx="2" fill="white" fillOpacity="0.5" />
      ))}
    </svg>
  );
}

function DrizzleIcon() {
  return (
    <svg width="52" height="48" viewBox="0 0 52 48" fill="none">
      <rect x="8" y="6" width="36" height="18" rx="9" fill="white" fillOpacity="0.75" />
      {[14, 24, 34].map((x, i) => (
        <line key={i} x1={x} y1="30" x2={x - 3} y2="42"
          stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
      ))}
    </svg>
  );
}

function RainIcon() {
  return (
    <svg width="52" height="48" viewBox="0 0 52 48" fill="none">
      <rect x="6" y="4" width="40" height="18" rx="9" fill="white" fillOpacity="0.75" />
      {[12, 22, 32, 42].map((x, i) => (
        <line key={i} x1={x} y1="28" x2={x - 4} y2="44"
          stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" />
      ))}
    </svg>
  );
}

function SnowIcon() {
  return (
    <svg width="52" height="48" viewBox="0 0 52 48" fill="none">
      <rect x="6" y="4" width="40" height="18" rx="9" fill="white" fillOpacity="0.75" />
      {[14, 26, 38].map((x, i) => (
        <g key={i}>
          <line x1={x} y1="28" x2={x} y2="44" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
          <line x1={x-4} y1="33" x2={x+4} y2="33" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
          <line x1={x-4} y1="39" x2={x+4} y2="39" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

function ThunderIcon() {
  return (
    <svg width="52" height="48" viewBox="0 0 52 48" fill="none">
      <rect x="6" y="4" width="40" height="18" rx="9" fill="white" fillOpacity="0.65" />
      <polygon points="28,26 20,38 26,38 22,48 34,34 27,34" fill="#FCD34D" />
    </svg>
  );
}

interface WeatherData {
  temp: number;
  code: number;
  isDay: boolean;
  city: string;
}

export function DashboardGreeting({ name = "Usuário" }: DashboardGreetingProps) {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const { latitude: lat, longitude: lon } = coords;
        const [weatherRes, geoRes] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`),
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`),
        ]);
        const weatherData = await weatherRes.json();
        const geoData = await geoRes.json();
        const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || "";
        setWeather({
          temp: Math.round(weatherData.current.temperature_2m),
          code: weatherData.current.weather_code,
          isDay: weatherData.current.is_day === 1,
          city,
        });
      } catch {}
    }, () => {});
  }, []);

  const hour = now.getHours();
  const hour12 = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  const timeStr = `${pad(hour12)}:${pad(now.getMinutes())} ${ampm}`;
  const dateStr = now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  const dateCap = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  const weatherInfo = weather ? getWeatherInfo(weather.code, weather.isDay) : null;

  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-border/30 bg-card px-7 py-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-white/[0.03]">

      <div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-[0.06] blur-3xl"
        style={{ background: "var(--brand-primary)" }}
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        {/* Esquerda — saudação */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
            Visão geral
          </p>
          <h2 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-foreground sm:text-[30px]">
            {getGreeting(hour)}, {name.split(" ")[0]}
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
            {getSubtitle(hour)}
          </p>
        </div>

        {/* Direita — data + clima + status */}
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <p className="text-[13px] font-medium text-foreground/80 sm:text-right">
            {dateCap}
          </p>

          {weatherInfo && (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">{weatherInfo.icon}</div>
              <div className="flex flex-col sm:items-end">
                <p className="text-[22px] font-bold leading-none text-foreground">
                  {weather!.temp}°C
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                  {weatherInfo.label}{weather!.city ? ` · ${weather!.city}` : ""}
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
