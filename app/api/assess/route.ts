import { NextRequest, NextResponse } from 'next/server';
import { getKCCData } from '@/lib/data/mock-kcc';
//import { getMockSatelliteData, getMockWeatherForecast } from '@/lib/data/mock-satellite';
//import { getMockSatelliteData } from '@/lib/data/mock-satellite';
import { getRealSatelliteData } from '@/lib/data/satellite-api';
import { getRealWeatherForecast } from '@/lib/data/weather-api';
import { calculateRiskScore, calculatePremium, generateRiskFactors, generateSuggestions } from '@/lib/ml/risk-calculator';
import { detectFraud } from '@/lib/ml/fraud-detector';
import { AssessmentRequest, AssessmentResponse } from '@/types';

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

        // Validate required fields
        if (!kcc_id || !crop_type || !season || !gps_latitude || !gps_longitude) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: kcc_id, crop_type, season, gps_latitude, gps_longitude' },
                { status: 400 }
            );
        }

        // Fetch KCC data (mock)
        let kccData = getKCCData(kcc_id);

        if (!kccData) {
            return NextResponse.json(
                { success: false, error: 'KCC ID not found' },
                { status: 404 }
            );
        }


        // Fetch satellite data (mock)
        //const satelliteData = getMockSatelliteData(gps_latitude, gps_longitude);
        // Fetch weather forecast (mock)
        //const weatherData = await getMockWeatherForecast(gps_latitude, gps_longitude);
        // NEW:
        const satelliteData = await getRealSatelliteData(gps_latitude, gps_longitude);

        // Fetch weather forecast (mock)
        const weatherData = await getRealWeatherForecast(gps_latitude, gps_longitude);

        // Calculate water sources count
        const water_source_count = borewell_count + (has_canal_access ? 1 : 0);

        // Calculate risk score
        const riskCalculation = calculateRiskScore({
            rainfall_deficit: weatherData.risks.drought_probability * 100,
            heatwave_days: weatherData.risks.heatwave_days,
            monsoon_reliability: 1 - weatherData.risks.drought_probability,
            irrigation_type: irrigation_type || 'rainfed',
            water_source_count,
            borewell_depth: borewell_depth_ft,
            crop_count: 1,
            has_livestock: livestock_count > 0,
            land_acres: kccData.land_acres,
            kcc_repayment_rate: kccData.repayment_rate_percent,
            outstanding_debt_ratio: kccData.outstanding_amount / (kccData.land_acres * 50000),
            has_insurance: false
        });

        // Run fraud detection
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

        // Calculate premium
        const district_avg_premium = 5000;
        const pricing = calculatePremium(riskCalculation.final_score, sum_insured, district_avg_premium);

        // Generate risk factors and suggestions
        const risk_factors = generateRiskFactors(
            riskCalculation.breakdown.weather_risk,
            riskCalculation.breakdown.infrastructure,
            riskCalculation.breakdown.diversification,
            satelliteData.ndvi
        );

        const improvement_suggestions = generateSuggestions(
            riskCalculation.final_score,
            riskCalculation.breakdown,
            {
                irrigation_type,
                water_source_count,
                crop_count: 1,
                has_livestock: livestock_count > 0
            }
        );

        const processingTime = Date.now() - startTime;

        // Save fraud case if flags exist
        if (fraudCheck.flags.length > 0) {
            // Dynamically import to avoid circular dependencies if any, though likely safe to import at top
            const { saveFraudCase } = require('@/lib/fraud-service');

            saveFraudCase({
                id: `fraud_${Date.now()}`,
                kcc_id,
                farmer_name: kccData.farmer_name,
                phone: kccData.phone,
                severity: fraudCheck.recommendation === 'reject' ? 'critical' : fraudCheck.recommendation === 'field_verify' ? 'high' : 'medium',
                flags: fraudCheck.flags,
                assessment_date: new Date().toISOString().split('T')[0],
                fraud_score: fraudCheck.fraud_score
            });
        }

        const response: AssessmentResponse = {
            success: true,
            data: {
                farmer_id: `farmer_${kcc_id}`,
                farmer_name: kccData.farmer_name,
                assessment_id: `assess_${Date.now()}`,
                final_risk_score: riskCalculation.final_score,
                risk_category: riskCalculation.risk_category,
                confidence_level: riskCalculation.confidence,
                scores: riskCalculation.breakdown,
                recommended_premium: pricing.recommended_premium,
                district_avg_premium: pricing.district_avg_premium,
                savings_amount: pricing.savings,
                savings_percent: pricing.savings_percent,
                fraud_flags: fraudCheck.flags,
                requires_field_verification: fraudCheck.recommendation === 'field_verify',
                trust_score: 50 - fraudCheck.fraud_score / 2,
                risk_factors,
                improvement_suggestions,
                data_sources: ['KCC Registry', 'NASA Satellite', 'Weather API'],
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
