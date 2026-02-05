import { NextRequest, NextResponse } from 'next/server';
// Keep your original data imports
import { getKCCData, generateRandomKCC } from '@/lib/data/mock-kcc';
import { getMockSatelliteData, getMockWeatherForecast } from '@/lib/data/mock-satellite';
// Keep fraud detector and premium calculator
import { detectFraud } from '@/lib/ml/fraud-detector';
//import { calculatePremium } from '@/lib/ml/risk-calculator';
import { AssessmentRequest, AssessmentResponse } from '@/types';

// Import the new ML Client
import { mlClient, MLPredictionInput } from '@/lib/ml/ml-client';

export async function POST(req: NextRequest) {
    const startTime = Date.now();

    try {
        const body: AssessmentRequest = await req.json();
        const {
            kcc_id,
            crop_type,
            season,
            gps_latitude,
            gps_longitude,
            irrigation_type,
            borewell_count = 0,
            borewell_depth_ft = 0,
            has_canal_access = false,
            owns_tractor = false,
            has_storage = false,
            livestock_count = 0,
            sum_insured = 200000
        } = body;

        // 1. Validation (Keep existing)
        if (!kcc_id || !crop_type || !season || !gps_latitude || !gps_longitude) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 2. Data Enrichment (Keep existing logic)
        // Fetch KCC data
        let kccData = getKCCData(kcc_id);
        if (!kccData) {
            kccData = generateRandomKCC(kcc_id);
        }

        // Fetch satellite & weather data
        const satelliteData = getMockSatelliteData(gps_latitude, gps_longitude);
        const weatherData = getMockWeatherForecast(gps_latitude, gps_longitude);

        // 3. Prepare Input for Python Brain (The New Part)
        // We combine User Input + KCC Data + Satellite Data into one payload
        const mlInput: MLPredictionInput = {
            // User Inputs
            state: 'Maharashtra', // Default or derived from KCC
            crop_type: crop_type,
            season: season,
            irrigation_type: irrigation_type || 'rainfed',
            land_acres: kccData.land_acres, // Trust KCC over user input
            water_source_count: borewell_count + (has_canal_access ? 1 : 0),
            borewell_count: borewell_count,
            borewell_depth_ft: borewell_depth_ft,
            has_canal_access: has_canal_access,
            crop_count: 1, // Defaulting as we don't have full history
            has_livestock: livestock_count > 0,
            livestock_count: livestock_count,
            owns_tractor: owns_tractor,
            has_storage: has_storage,

            // Enriched Financial Data (From KCC Mock)
            kcc_score: 750, // Mock score derived from repayment
            kcc_repayment_rate: kccData.repayment_rate_percent,
            outstanding_debt_ratio: kccData.outstanding_amount / (kccData.land_acres * 50000),
            has_insurance_history: false,

            // Enriched Environmental Data (From Satellite/Weather Mocks)
            rainfall_deficit_percent: weatherData.risks.drought_probability * 100, // Map probability to deficit
            actual_rainfall_mm: 1000 * (1 - weatherData.risks.drought_probability), // Estimate
            heatwave_days: weatherData.risks.heatwave_days,
            monsoon_reliability: 1 - weatherData.risks.drought_probability,
            ndvi_score: satelliteData.ndvi,
            soil_moisture_percent: satelliteData.soil_moisture,
            soil_fertility_index: 0.7, // Default
        };

        // 4. Calculate Risk (Call Python Brain instead of local function)
        // This replaces 'calculateRiskScore(...)'
        const prediction = await mlClient.predict(mlInput);

        // 5. Fraud Detection (Keep existing logic)
        const fraudCheck = detectFraud({
            farmer_input: {
                land_acres: kccData.land_acres,
                irrigation_type,
                crop_type
            },
            kcc_data: {
                land_acres: kccData.land_acres,
                village: kccData.village,
                district: kccData.district
            },
            satellite_data: {
                ndvi: satelliteData.ndvi,
                ndvi_uniformity: 0.7 + Math.random() * 0.2,
                soil_moisture: satelliteData.soil_moisture
            },
            nearby_farms: []
        });

        // 6. Pricing (Keep existing logic)
        const district_avg_premium = 5000;
        //const pricing = calculatePremium(
        //    prediction.risk_score, // Use the score from Python
        //    sum_insured, 
        //    district_avg_premium
        //);

        // 7. Response Construction
        const processingTime = Date.now() - startTime;

        const response: AssessmentResponse = {
            success: true,
            data: {
                farmer_id: `farmer_${kcc_id}`,
                farmer_name: kccData.farmer_name,
                assessment_id: `assess_${Date.now()}`,
                
                // New ML Data
                final_risk_score: prediction.risk_score,
                risk_category: prediction.risk_category as any, // Type cast if needed
                confidence_level: prediction.confidence as any,
                scores: prediction.breakdown, // Now comes from SHAP values!
                
                // Existing Logic Data
                //recommended_premium: pricing.recommended_premium,
                //district_avg_premium: pricing.district_avg_premium,
                //savings_amount: pricing.savings,
                //savings_percent: pricing.savings_percent,
                
                // Fraud Data
                fraud_flags: fraudCheck.flags,
                requires_field_verification: fraudCheck.recommendation === 'field_verify',
                trust_score: 50 - fraudCheck.fraud_score / 2,
                
                // Frontend Helpers
                risk_factors: [
                    // Map top drivers from Python to your UI format
                    ...(prediction.top_risk_drivers || []).map(d => d.factor),
                    ...(fraudCheck.flags)
                ]as any,
                improvement_suggestions: [
                    // Map protective factors to OBJECTS, not strings
                    ...(prediction.top_protective_factors || []).map(p => ({
                        action: p.factor, // Used for icon matching
                        title: `Maintain ${p.factor}`,
                        description: `Contributes positively to your score`,
                        priority: 'high'
                    })),
                    // Static suggestion as an object
                    {
                        action: 'irrigation',
                        title: 'Consider Drip Irrigation',
                        description: 'Can reduce premium by 15%',
                        priority: 'high'
                    }
                ]as any,
                
                data_sources: ['KCC Registry', 'NASA Satellite', 'CatBoost ML Engine'],
                processing_time_ms: processingTime
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Assessment error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}