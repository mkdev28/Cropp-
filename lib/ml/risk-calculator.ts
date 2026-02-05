// Risk calculation engine - Multi-source fusion scoring
export interface RiskInputs {
  // Weather
  rainfall_deficit: number;
  heatwave_days: number;
  monsoon_reliability: number;
  
  // Infrastructure
  irrigation_type: string;
  water_source_count: number;
  borewell_depth: number;
  
  // Diversification
  crop_count: number;
  has_livestock: boolean;
  land_acres: number;
  
  // Financial
  kcc_repayment_rate: number;
  outstanding_debt_ratio: number;
  has_insurance: boolean;
}

export interface RiskResult {
  final_score: number;
  breakdown: {
    weather_risk: number;
    infrastructure: number;
    diversification: number;
    financial_health: number;
  };
  confidence: 'high' | 'medium' | 'low';
  risk_category: 'low' | 'medium' | 'high';
}

const IRRIGATION_SCORES: Record<string, number> = {
  'drip': 10,
  'sprinkler': 8,
  'canal': 6,
  'borewell': 5,
  'flood': 4,
  'rainfed': 0,
  'none': 0
};

export function calculateRiskScore(inputs: RiskInputs): RiskResult {
  // Weather risk (0-25 points, lower is better - we invert for final score)
  let weather_risk = 25;
  weather_risk -= (inputs.monsoon_reliability * 10);
  weather_risk += (inputs.rainfall_deficit / 10);
  weather_risk += (inputs.heatwave_days * 0.5);
  weather_risk = Math.max(0, Math.min(25, weather_risk));
  
  // Infrastructure score (0-25 points, higher is better)
  let infrastructure = 0;
  infrastructure += IRRIGATION_SCORES[inputs.irrigation_type?.toLowerCase()] || 0;
  infrastructure += Math.min(inputs.water_source_count * 5, 10);
  infrastructure += Math.min(inputs.borewell_depth / 100, 5);
  infrastructure = Math.min(25, infrastructure);
  
  // Diversification score (0-25 points)
  let diversification = 0;
  diversification += Math.min(inputs.crop_count * 8, 16);
  diversification += inputs.has_livestock ? 5 : 0;
  diversification += Math.min(inputs.land_acres * 0.5, 4);
  diversification = Math.min(25, diversification);
  
  // Financial health (0-25 points)
  let financial_health = 0;
  financial_health += (inputs.kcc_repayment_rate / 4);
  financial_health -= (inputs.outstanding_debt_ratio * 10);
  financial_health += inputs.has_insurance ? 3 : 0;
  financial_health = Math.max(0, Math.min(25, financial_health));
  
  // Final score (weather risk is subtracted, others added)
  const total_strength = infrastructure + diversification + financial_health;
  const final_score = Math.round(total_strength - weather_risk + 50);
  
  // Determine confidence based on data completeness
  const confidence = inputs.irrigation_type && inputs.kcc_repayment_rate > 0 
    ? 'high' 
    : inputs.irrigation_type 
      ? 'medium' 
      : 'low';
  
  // Determine risk category
  const risk_category = final_score >= 70 ? 'low' : final_score >= 40 ? 'medium' : 'high';
  
  return {
    final_score: Math.max(0, Math.min(100, final_score)),
    breakdown: {
      weather_risk: Math.round(weather_risk),
      infrastructure: Math.round(infrastructure),
      diversification: Math.round(diversification),
      financial_health: Math.round(financial_health)
    },
    confidence,
    risk_category
  };
}

export function calculatePremium(
  risk_score: number,
  sum_insured: number = 200000,
  district_avg_premium: number = 5000
): {
  recommended_premium: number;
  district_avg_premium: number;
  savings: number;
  savings_percent: number;
} {
  // Base premium rate (3% of sum insured for score 50)
  const base_rate = 0.03;
  
  // Adjust rate based on score
  // Score 100 → 1% rate, Score 0 → 6% rate
  const risk_adjusted_rate = base_rate * (2 - (risk_score / 100));
  
  const recommended_premium = Math.round(sum_insured * risk_adjusted_rate);
  const savings = Math.max(0, district_avg_premium - recommended_premium);
  const savings_percent = Math.round((savings / district_avg_premium) * 100);
  
  return {
    recommended_premium,
    district_avg_premium,
    savings,
    savings_percent
  };
}

export function generateRiskFactors(
  weather_score: number,
  infrastructure_score: number,
  diversification_score: number,
  ndvi?: number
): string[] {
  const factors: string[] = [];
  
  if (weather_score > 15) {
    factors.push('High weather variability in forecast period');
  }
  if (weather_score > 10 && weather_score <= 15) {
    factors.push('Moderate drought probability detected');
  }
  
  if (infrastructure_score < 10) {
    factors.push('Limited irrigation infrastructure');
  }
  
  if (diversification_score < 10) {
    factors.push('Low crop diversification - single crop dependency');
  }
  
  if (ndvi !== undefined && ndvi < 0.5) {
    factors.push('Current vegetation health below optimal levels');
  }
  
  return factors;
}

export interface Suggestion {
  action: string;
  description: string;
  score_increase: number;
  premium_savings: number;
  estimated_cost: number;
  govt_subsidy_available: boolean;
  subsidy_percent: number;
  impact: 'high' | 'medium' | 'low';
  priority_rank: number;
}

export function generateSuggestions(
  score: number,
  breakdown: RiskResult['breakdown'],
  currentSetup: Partial<RiskInputs>
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  if (!currentSetup.irrigation_type || currentSetup.irrigation_type === 'rainfed' || currentSetup.irrigation_type === 'none') {
    suggestions.push({
      action: 'Install drip irrigation system',
      description: 'Reduce water usage by 50% and increase crop yield by 30%',
      score_increase: 12,
      premium_savings: 800,
      estimated_cost: 50000,
      govt_subsidy_available: true,
      subsidy_percent: 55,
      impact: 'high',
      priority_rank: 1
    });
  }
  
  if ((currentSetup.water_source_count || 0) < 2) {
    suggestions.push({
      action: 'Add secondary water source',
      description: 'Backup water source protects against single point failure',
      score_increase: 8,
      premium_savings: 600,
      estimated_cost: 80000,
      govt_subsidy_available: true,
      subsidy_percent: 50,
      impact: 'high',
      priority_rank: 2
    });
  }
  
  if ((currentSetup.crop_count || 1) < 2) {
    suggestions.push({
      action: 'Diversify with second crop',
      description: 'Reduces risk from single crop failure and price volatility',
      score_increase: 5,
      premium_savings: 400,
      estimated_cost: 5000,
      govt_subsidy_available: false,
      subsidy_percent: 0,
      impact: 'medium',
      priority_rank: 3
    });
  }
  
  if (!currentSetup.has_livestock) {
    suggestions.push({
      action: 'Add dairy livestock',
      description: 'Alternative income source during crop failures',
      score_increase: 5,
      premium_savings: 350,
      estimated_cost: 40000,
      govt_subsidy_available: true,
      subsidy_percent: 40,
      impact: 'medium',
      priority_rank: 4
    });
  }
  
  return suggestions;
}
