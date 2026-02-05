// lib/data/satellite-api.ts

import { SatelliteData } from '@/types';

// NASA POWER API response type
interface NASAPowerResponse {
  properties: {
    parameter: {
      T2M: Record<string, number>;           // Temperature
      PRECTOTCORR: Record<string, number>;   // Precipitation
      ALLSKY_SFC_SW_DWN: Record<string, number>; // Solar radiation
    };
  };
}

export async function getRealSatelliteData(
  lat: number,
  lng: number
): Promise<SatelliteData> {
  
  // Get last 30 days of data
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const formatDate = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');
  
  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?` +
    `parameters=T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN` +
    `&community=AG` +
    `&longitude=${lng}` +
    `&latitude=${lat}` +
    `&start=${formatDate(startDate)}` +
    `&end=${formatDate(endDate)}` +
    `&format=JSON`;
  
  const response = await fetch(url);
  const data: NASAPowerResponse = await response.json();
  
  // Extract parameter values
  const temps = Object.values(data.properties.parameter.T2M);
  const precips = Object.values(data.properties.parameter.PRECTOTCORR);
  const solar = Object.values(data.properties.parameter.ALLSKY_SFC_SW_DWN);
  
  // Calculate averages (filter out -999 which means missing data)
  const validTemps = temps.filter(t => t > -900);
  const validPrecips = precips.filter(p => p > -900);
  const validSolar = solar.filter(s => s > -900);
  
  const avgTemp = validTemps.reduce((a, b) => a + b, 0) / validTemps.length;
  const totalPrecip = validPrecips.reduce((a, b) => a + b, 0);
  const avgSolar = validSolar.reduce((a, b) => a + b, 0) / validSolar.length;
  
  // Estimate NDVI from solar radiation (simplified)
  // Real NDVI needs Landsat/Sentinel data, this is an approximation
  const estimatedNDVI = Math.min(0.9, Math.max(0.1, avgSolar / 300));
  
  // Estimate soil moisture from precipitation
  const estimatedMoisture = Math.min(100, totalPrecip * 2);
  
  return {
    ndvi: Math.round(estimatedNDVI * 100) / 100,
    soil_moisture: Math.round(estimatedMoisture),
    land_surface_temp: Math.round(avgTemp * 10) / 10,
    precipitation_mm: Math.round(totalPrecip * 10) / 10,
    ndvi_30day_avg: Math.round(estimatedNDVI * 100) / 100,
    ndvi_change_percent: 0  // Would need historical comparison
  };
}
