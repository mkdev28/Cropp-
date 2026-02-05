// lib/data/weather-api.ts

import { WeatherForecast } from '@/types';

// OpenWeather API response type
interface OpenWeatherResponse {
  city: {
    name: string;
  };
  list: Array<{
    dt_txt: string;
    main: {
      temp: number;
      temp_max: number;
      temp_min: number;
      humidity: number;
    };
    wind: {
      speed: number;
    };
    rain?: {
      '3h'?: number;
    };
    pop: number;
    weather: Array<{
      main: string;
    }>;
  }>;
}

export async function getRealWeatherForecast(
  lat: number, 
  lng: number
): Promise<WeatherForecast> {
  
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
  
  const response = await fetch(url);
  const data: OpenWeatherResponse = await response.json();  // ← Type added here
  
  return {
    location: {
      name: data.city.name,
      district: data.city.name,
      coordinates: [lat, lng]
    },
    current: {
      temp_celsius: data.list[0].main.temp,
      humidity_percent: data.list[0].main.humidity,
      rainfall_mm: data.list[0].rain?.['3h'] || 0,
      wind_speed_kmh: data.list[0].wind.speed * 3.6
    },
    forecast: data.list.slice(0, 15).map(item => ({
      date: item.dt_txt.split(' ')[0],
      temp_max: item.main.temp_max,
      temp_min: item.main.temp_min,
      rainfall_probability: item.pop,
      rainfall_amount_mm: item.rain?.['3h'] || 0,
      conditions: item.weather[0].main
    })),
    risks: {
      drought_probability: 0.2,
      heatwave_days: 0,
      heavy_rainfall_days: 0,
      favorable_days: 10
    }
  };
}
