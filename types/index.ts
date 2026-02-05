// TypeScript types for AgriRisk Pro

export interface Farmer {
    id: string;
    kcc_id: string;
    name: string;
    phone: string;
    gps_latitude: number;
    gps_longitude: number;
    land_acres: number;
    village: string;
    district: string;
    state: string;
    trust_score: number;
    total_assessments: number;
    created_at: string;
    updated_at: string;
}

export interface KCCData {
    kcc_id: string;
    farmer_name: string;
    phone: string;
    land_acres: number;
    registered_crops: string[];
    kcc_issue_date: string;
    kcc_expiry_date: string;
    total_loans_taken: number;
    loans_repaid_ontime: number;
    repayment_rate_percent: number;
    outstanding_amount: number;
    receives_pm_kisan: boolean;
    last_subsidy_date: string;
    village: string;
    district: string;
    state: string;
    approximate_location: {
        lat: number;
        lng: number;
    };
}

export interface SatelliteData {
    ndvi: number;
    soil_moisture: number;
    land_surface_temp: number;
    precipitation_mm: number;
    ndvi_30day_avg: number;
    ndvi_change_percent: number;
}

export interface WeatherForecast {
    location: {
        name: string;
        district: string;
        coordinates: [number, number];
    };
    current: {
        temp_celsius: number;
        humidity_percent: number;
        rainfall_mm: number;
        wind_speed_kmh: number;
    };
    forecast: Array<{
        date: string;
        temp_max: number;
        temp_min: number;
        rainfall_probability: number;
        rainfall_amount_mm: number;
        conditions: string;
    }>;
    risks: {
        drought_probability: number;
        heatwave_days: number;
        heavy_rainfall_days: number;
        favorable_days: number;
    };
}

export interface RiskAssessment {
    id: string;
    farmer_id: string;
    assessment_date: string;
    crop_type: string;
    season: 'kharif' | 'rabi';
    weather_risk_score: number;
    infrastructure_score: number;
    diversification_score: number;
    financial_score: number;
    final_risk_score: number;
    risk_category: 'low' | 'medium' | 'high';
    recommended_premium: number;
    district_avg_premium: number;
    confidence_level: 'high' | 'medium' | 'low';
    fraud_flags: FraudFlag[];
    requires_field_verification: boolean;
    data_sources: string[];
    processing_time_ms: number;
}

export interface FraudFlag {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: string;
    evidence: {
        claimed: string | number;
        verified: string | number;
        discrepancy: string;
    };
    confidence: number;
}

export interface FarmInfrastructure {
    irrigation_type: string;
    borewell_count: number;
    borewell_depth_ft: number;
    has_canal_access: boolean;
    has_pond: boolean;
    has_rainwater_harvesting: boolean;
    owns_tractor: boolean;
    has_storage_facility: boolean;
    has_greenhouse: boolean;
    livestock_count: number;
}

export interface RiskAlert {
    id: string;
    farmer_id: string;
    alert_type: 'vegetation_stress' | 'drought_risk' | 'heatwave_risk' | 'pest_outbreak' | 'heavy_rainfall';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    recommendation?: string;
    viewed: boolean;
    action_taken: boolean;
    created_at: string;
}

export interface AssessmentRequest {
    kcc_id: string;
    crop_type: string;
    season: 'kharif' | 'rabi';
    gps_latitude: number;
    gps_longitude: number;
    irrigation_type?: string;
    borewell_count?: number;
    borewell_depth_ft?: number;
    has_canal_access?: boolean;
    owns_tractor?: boolean;
    has_storage?: boolean;
    livestock_count?: number;
    sum_insured?: number;
}

export interface AssessmentResponse {
    success: boolean;
    data: {
        farmer_id: string;
        farmer_name: string;
        assessment_id: string;
        final_risk_score: number;
        risk_category: 'low' | 'medium' | 'high';
        confidence_level: 'high' | 'medium' | 'low';
        scores: {
            weather_risk: number;
            infrastructure: number;
            diversification: number;
            financial_health: number;
        };
        recommended_premium: number;
        district_avg_premium: number;
        savings_amount: number;
        savings_percent: number;
        fraud_flags: FraudFlag[];
        requires_field_verification: boolean;
        trust_score: number;
        risk_factors: string[];
        improvement_suggestions: Suggestion[];
        data_sources: string[];
        processing_time_ms: number;
    };
    error?: string;
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

// Dashboard types
export interface PortfolioMetrics {
    total_policies: number;
    avg_risk_score: number;
    projected_loss_ratio: number;
    total_premium: number;
    low_risk_count: number;
    medium_risk_count: number;
    high_risk_count: number;
}

export interface FraudCase {
    id: string;
    kcc_id: string;
    farmer_name: string;
    phone: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    flags: FraudFlag[];
    assessment_date: string;
    fraud_score: number;
}
