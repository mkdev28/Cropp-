// Mock satellite and weather data generators
import { SatelliteData, WeatherForecast } from '@/types';

// Generate realistic satellite data based on location and season
export function getMockSatelliteData(lat: number, lng: number): SatelliteData {
    // Base NDVI varies by region and random factor
    const baseNDVI = 0.45 + Math.random() * 0.35;
    const ndviChange = (Math.random() - 0.5) * 20;

    return {
        ndvi: Math.round(baseNDVI * 100) / 100,
        soil_moisture: Math.floor(30 + Math.random() * 50),
        land_surface_temp: Math.round((25 + Math.random() * 15) * 10) / 10,
        precipitation_mm: Math.round(Math.random() * 50 * 10) / 10,
        ndvi_30day_avg: Math.round((baseNDVI + 0.05) * 100) / 100,
        ndvi_change_percent: Math.round(ndviChange * 10) / 10
    };
}

// Generate realistic weather forecast
export function getMockWeatherForecast(lat: number, lng: number): WeatherForecast {
    const districtNames: Record<string, string> = {
        '18-74': 'Pune',
        '19-73': 'Nashik',
        '20-77': 'Amravati',
        '17-74': 'Kolhapur',
        'default': 'Maharashtra'
    };

    const key = `${Math.floor(lat)}-${Math.floor(lng)}`;
    const district = districtNames[key] || districtNames['default'];

    // Current conditions
    const currentTemp = 25 + Math.random() * 15;
    const humidity = 40 + Math.random() * 40;

    // Generate 15-day forecast
    const forecast = [];
    for (let i = 0; i < 15; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        const tempBase = 28 + Math.sin(i / 3) * 5;
        const rainProb = Math.random() * 0.5;

        forecast.push({
            date: date.toISOString().split('T')[0],
            temp_max: Math.round((tempBase + 5 + Math.random() * 5) * 10) / 10,
            temp_min: Math.round((tempBase - 5 + Math.random() * 3) * 10) / 10,
            rainfall_probability: Math.round(rainProb * 100) / 100,
            rainfall_amount_mm: rainProb > 0.3 ? Math.round(Math.random() * 30 * 10) / 10 : 0,
            conditions: rainProb > 0.5 ? 'rain' : rainProb > 0.3 ? 'cloudy' : 'clear'
        });
    }

    // Calculate risk indicators
    const droughtProbability = Math.random() * 0.5;
    const heatwaveDays = Math.floor(Math.random() * 5);

    return {
        location: {
            name: district,
            district,
            coordinates: [lat, lng]
        },
        current: {
            temp_celsius: Math.round(currentTemp * 10) / 10,
            humidity_percent: Math.round(humidity),
            rainfall_mm: Math.round(Math.random() * 20 * 10) / 10,
            wind_speed_kmh: Math.round((5 + Math.random() * 20) * 10) / 10
        },
        forecast,
        risks: {
            drought_probability: Math.round(droughtProbability * 100) / 100,
            heatwave_days: heatwaveDays,
            heavy_rainfall_days: Math.floor(Math.random() * 3),
            favorable_days: 15 - heatwaveDays - Math.floor(Math.random() * 3)
        }
    };
}

// Get crop health assessment based on NDVI
export function assessCropHealth(ndvi: number): {
    status: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
    description: string;
} {
    if (ndvi >= 0.7) return { status: 'excellent', description: 'Vegetation is very healthy' };
    if (ndvi >= 0.55) return { status: 'good', description: 'Vegetation is healthy' };
    if (ndvi >= 0.4) return { status: 'moderate', description: 'Vegetation shows some stress' };
    if (ndvi >= 0.25) return { status: 'poor', description: 'Vegetation is under significant stress' };
    return { status: 'critical', description: 'Severe vegetation stress or bare soil' };
}
