// lib/ml/ml-client.ts

import { z } from 'zod'; // For runtime validation (npm install zod)

// === SCHEMAS (Runtime Validation) ===

const MLPredictionInputSchema = z.object({
  // Location
  state: z.string(),
  season: z.enum(['kharif', 'rabi']),
  year: z.number().optional(),
  
  // Farm characteristics
  crop_type: z.string(),
  land_acres: z.number().positive(),
  irrigation_type: z.string(),
  water_source_count: z.number().int().min(0),
  borewell_count: z.number().int().min(0).optional(),
  borewell_depth_ft: z.number().min(0),
  has_canal_access: z.boolean().optional(),
  crop_count: z.number().int().min(1),
  has_livestock: z.boolean(),
  livestock_count: z.number().int().min(0),
  owns_tractor: z.boolean().optional(),
  has_storage: z.boolean().optional(),
  
  // Financial
  kcc_score: z.number().min(300).max(900).optional(),
  kcc_repayment_rate: z.number().min(0).max(100),
  outstanding_debt_ratio: z.number().min(0),
  has_insurance_history: z.boolean(),
  
  // Weather
  rainfall_deficit_percent: z.number(),
  actual_rainfall_mm: z.number().min(0),
  heatwave_days: z.number().int().min(0),
  avg_temperature_c: z.number().optional(),
  monsoon_reliability: z.number().min(0).max(1),
  
  // Satellite/Soil
  ndvi_score: z.number().min(0).max(1),
  soil_moisture_percent: z.number().min(0).max(100),
  soil_fertility_index: z.number().min(0).max(1),
});

const MLPredictionOutputSchema = z.object({
  farmer_id: z.string().optional(),
  risk_score: z.number().int().min(0).max(100),
  risk_category: z.string(),
  category_label: z.string().optional(),
  claim_probability: z.number().min(0).max(100),
  confidence: z.enum(['high', 'medium', 'low']),
  breakdown: z.object({
    weather_risk: z.number().int().min(0).max(25),
    infrastructure: z.number().int().min(0).max(25),
    diversification: z.number().int().min(0).max(25),
    financial_health: z.number().int().min(0).max(25),
  }),
  top_risk_drivers: z.array(z.object({
    factor: z.string(),
    impact: z.number(),
  })).optional(),
  top_protective_factors: z.array(z.object({
    factor: z.string(),
    impact: z.number(),
  })).optional(),
});

export type MLPredictionInput = z.infer<typeof MLPredictionInputSchema>;
export type MLPredictionOutput = z.infer<typeof MLPredictionOutputSchema>;

// === FALLBACK: RULE-BASED MODEL ===

function calculateFallbackRiskScore(input: MLPredictionInput): MLPredictionOutput {
  /**
   * Simple rule-based model as fallback when ML server is down
   * Uses heuristics from domain knowledge
   */
  
  let risk_score = 50; // Base score
  
  // Weather impact (strongest factor)
  if (input.rainfall_deficit_percent > 0.4) {
    risk_score -= 25; // Severe drought
  } else if (input.rainfall_deficit_percent > 0.2) {
    risk_score -= 15; // Moderate drought
  } else if (input.rainfall_deficit_percent < -0.3) {
    risk_score -= 10; // Flooding
  }
  
  if (input.heatwave_days > 10) {
    risk_score -= 10;
  }
  
  // Irrigation protection
  const irrigationBonus: Record<string, number> = {
    'drip': 25,
    'sprinkler': 20,
    'canal': 15,
    'borewell': 12,
    'flood': 8,
    'rainfed': 0,
    'none': 0,
  };
  risk_score += irrigationBonus[input.irrigation_type.toLowerCase()] || 0;
  
  // Water sources
  if (input.water_source_count >= 3) risk_score += 10;
  else if (input.water_source_count === 2) risk_score += 5;
  
  // Diversification
  if (input.crop_count >= 3) risk_score += 8;
  else if (input.crop_count === 2) risk_score += 4;
  
  if (input.has_livestock) risk_score += 5;
  
  // Financial health
  if (input.kcc_repayment_rate > 80) {
    risk_score += 8;
  } else if (input.kcc_repayment_rate < 60) {
    risk_score -= 8;
  }
  
  if (input.outstanding_debt_ratio > 1.0) {
    risk_score -= 6;
  }
  
  // Vegetation health
  if (input.ndvi_score < 0.4) {
    risk_score -= 10;
  } else if (input.ndvi_score > 0.7) {
    risk_score += 5;
  }
  
  // Clamp to 0-100
  risk_score = Math.max(0, Math.min(100, risk_score));
  
  // Determine category
  let risk_category: string;
  let category_label: string;
  
  if (risk_score >= 75) {
    risk_category = 'low';
    category_label = 'Low Risk (Safe)';
  } else if (risk_score >= 50) {
    risk_category = 'medium';
    category_label = 'Moderate Risk';
  } else if (risk_score >= 25) {
    risk_category = 'high';
    category_label = 'High Risk';
  } else {
    risk_category = 'high';
    category_label = 'Critical Risk';
  }
  
  // Approximate claim probability
  const claim_probability = Math.round((100 - risk_score) * 0.8); // 0-80% range
  
  // Simple breakdown (heuristics)
  const weather_risk = Math.max(0, Math.min(25, 
    15 + input.rainfall_deficit_percent * 30 + input.heatwave_days * 0.5
  ));
  
  const infrastructure = Math.min(25, 
    (irrigationBonus[input.irrigation_type.toLowerCase()] || 0) + 
    input.water_source_count * 3
  );
  
  const diversification = Math.min(25, 
    input.crop_count * 6 + (input.has_livestock ? 5 : 0)
  );
  
  const financial_health = Math.min(25,
    (input.kcc_repayment_rate / 100) * 15 + 
    (1 - Math.min(input.outstanding_debt_ratio, 1.5) / 1.5) * 10
  );
  
  return {
    farmer_id: input.state + '_fallback',
    risk_score: Math.round(risk_score),
    risk_category,
    category_label,
    claim_probability,
    confidence: 'medium', // Fallback is always medium confidence
    breakdown: {
      weather_risk: Math.round(weather_risk),
      infrastructure: Math.round(infrastructure),
      diversification: Math.round(diversification),
      financial_health: Math.round(financial_health),
    },
  };
}

// === ML CLIENT ===

export class MLModelClient {
  private apiUrl: string;
  private timeout: number;
  private maxRetries: number;
  private useFallback: boolean;
  
  constructor(options?: {
    apiUrl?: string;
    timeout?: number;
    maxRetries?: number;
    useFallback?: boolean;
  }) {
    this.apiUrl = options?.apiUrl || process.env.ML_API_URL || 'http://127.0.0.1:8000';
    this.timeout = options?.timeout || 10000; // 10 seconds
    this.maxRetries = options?.maxRetries || 2;
    this.useFallback = options?.useFallback ?? true; // Enable by default
  }
  
  /**
   * Get risk prediction from ML server with retry and fallback
   */
  async predict(rawInput: MLPredictionInput): Promise<MLPredictionOutput> {
    
    // === 1. NORMALIZE INPUTS (The Translator) ===
    // This fixes "Drip" -> "drip" and "20" -> "0.20" automatically
    const input = {
      ...rawInput,
      state: rawInput.state.trim(),
      season: rawInput.season.toLowerCase() as any, // Cast to match enum
      crop_type: rawInput.crop_type.toLowerCase(),
      irrigation_type: rawInput.irrigation_type.toLowerCase(),
      
      // Fix Percentages: If user enters "20" for 20%, convert to 0.20
      rainfall_deficit_percent: rawInput.rainfall_deficit_percent > 1 
        ? rawInput.rainfall_deficit_percent / 100 
        : rawInput.rainfall_deficit_percent,
        
      soil_moisture_percent: rawInput.soil_moisture_percent > 1 
        ? rawInput.soil_moisture_percent / 100 
        : rawInput.soil_moisture_percent,
    };

    // Validate input
    try {
      MLPredictionInputSchema.parse(input);
    } catch (error) {
      console.error('Invalid ML input:', error);
      throw new Error('Invalid input data for ML model');
    }
    
    // Try ML server with retries
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const result = await this._callMLServer(input);
        
        // Validate output
        const validated = MLPredictionOutputSchema.parse(result);
        return validated;
        
      } catch (error) {
        console.warn(`ML prediction attempt ${attempt + 1} failed:`, error);
        
        // If last attempt and fallback enabled, use fallback
        if (attempt === this.maxRetries - 1) {
          if (this.useFallback) {
            console.warn('ML server failed, using fallback rule-based model');
            return calculateFallbackRiskScore(input);
          } else {
            throw error;
          }
        }
        
        // Wait before retry (exponential backoff)
        await this._sleep(Math.min(1000 * Math.pow(2, attempt), 5000));
      }
    }
    
    // Should never reach here, but TypeScript needs it
    throw new Error('ML prediction failed after all retries');
  }
  
  /**
   * Internal: Call ML server with timeout
   */
  private async _callMLServer(input: MLPredictionInput): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(`${this.apiUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ML Server Error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown ML error');
      }
      
      return data.data;
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`ML server timeout after ${this.timeout}ms`);
      }
      
      throw error;
    }
  }
  
  /**
   * Health check - verify ML server is running
   */
  async healthCheck(): Promise<{ 
    status: 'healthy' | 'unhealthy'; 
    message: string;
    latency?: number;
  }> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        return {
          status: 'healthy',
          message: data.message || 'ML server is running',
          latency,
        };
      } else {
        return {
          status: 'unhealthy',
          message: `ML server returned ${response.status}`,
        };
      }
      
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: error.message || 'ML server is unreachable',
      };
    }
  }
  
  /**
   * Batch prediction (for bulk processing)
   */
  async predictBatch(
    inputs: MLPredictionInput[]
  ): Promise<MLPredictionOutput[]> {
    try {
      const response = await fetch(`${this.apiUrl}/predict/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs }),
      });
      
      if (!response.ok) {
        throw new Error(`Batch prediction failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
      
    } catch (error) {
      console.error('Batch prediction failed:', error);
      
      // Fallback: process one by one
      if (this.useFallback) {
        console.warn('Using sequential fallback for batch prediction');
        return Promise.all(inputs.map(input => this.predict(input)));
      }
      
      throw error;
    }
  }
  
  /**
   * Utility: sleep
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// === SINGLETON INSTANCE ===

export const mlClient = new MLModelClient({
  useFallback: true, // Always have backup during hackathon
  timeout: 10000,
  maxRetries: 2,
});

// === CONVENIENCE WRAPPER ===

/**
 * Simple wrapper for Next.js API routes
 */
export async function getPrediction(
  input: MLPredictionInput
): Promise<MLPredictionOutput> {
  return mlClient.predict(input);
}

/**
 * Check if ML service is available
 */
export async function isMLServiceHealthy(): Promise<boolean> {
  const health = await mlClient.healthCheck();
  return health.status === 'healthy';
}