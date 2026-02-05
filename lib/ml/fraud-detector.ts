// Fraud detection engine - Rule-based with anomaly detection

export interface FraudFlag {
    type: 'land_mismatch' | 'irrigation_mismatch' | 'crop_mismatch' | 'claim_anomaly' | 'location_anomaly';
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: string;
    evidence: {
        claimed: string | number;
        verified: string | number;
        discrepancy: string;
    };
    confidence: number;
}

export interface FraudCheckResult {
    fraud_score: number;
    flags: FraudFlag[];
    recommendation: 'approve' | 'field_verify' | 'reject';
}

interface FraudCheckParams {
    farmer_input: {
        land_acres?: number;
        irrigation_type?: string;
        crop_type?: string;
        claimed_loss?: number;
    };
    kcc_data: {
        land_acres?: number;
        village?: string;
        district?: string;
    };
    satellite_data?: {
        ndvi?: number;
        ndvi_uniformity?: number;
        soil_moisture?: number;
    };
    nearby_farms?: Array<{
        claimed_loss?: number;
        ndvi?: number;
    }>;
}

// Expected NDVI ranges for different crops (healthy vegetation)
const CROP_NDVI_RANGES: Record<string, { min: number; typical: number }> = {
    'sugarcane': { min: 0.6, typical: 0.75 },
    'cotton': { min: 0.45, typical: 0.65 },
    'wheat': { min: 0.5, typical: 0.70 },
    'rice': { min: 0.5, typical: 0.68 },
    'soybean': { min: 0.4, typical: 0.60 },
    'maize': { min: 0.45, typical: 0.65 },
    'default': { min: 0.35, typical: 0.50 }
};

export function detectFraud(params: FraudCheckParams): FraudCheckResult {
    const flags: FraudFlag[] = [];
    const { farmer_input, kcc_data, satellite_data, nearby_farms } = params;

    // Check 1: Land size mismatch
    if (farmer_input.land_acres && kcc_data.land_acres) {
        const ratio = farmer_input.land_acres / kcc_data.land_acres;
        if (ratio > 1.15) {
            const severity = ratio > 2 ? 'critical' : ratio > 1.5 ? 'high' : 'medium';
            flags.push({
                type: 'land_mismatch',
                severity,
                details: `Claimed ${farmer_input.land_acres} acres but KCC records show ${kcc_data.land_acres} acres`,
                evidence: {
                    claimed: farmer_input.land_acres,
                    verified: kcc_data.land_acres,
                    discrepancy: `${Math.round((ratio - 1) * 100)}% inflation`
                },
                confidence: 95
            });
        }
    }

    // Check 2: Irrigation type verification via NDVI uniformity
    if (farmer_input.irrigation_type === 'drip' && satellite_data?.ndvi_uniformity !== undefined) {
        if (satellite_data.ndvi_uniformity < 0.6) {
            flags.push({
                type: 'irrigation_mismatch',
                severity: 'medium',
                details: 'Claimed drip irrigation but satellite imagery shows irregular vegetation patterns',
                evidence: {
                    claimed: 'Drip irrigation',
                    verified: `NDVI uniformity: ${Math.round(satellite_data.ndvi_uniformity * 100)}%`,
                    discrepancy: 'Expected >60% uniformity for drip systems'
                },
                confidence: 75
            });
        }
    }

    // Check 3: Crop type verification via NDVI
    if (farmer_input.crop_type && satellite_data?.ndvi !== undefined) {
        const cropRange = CROP_NDVI_RANGES[farmer_input.crop_type.toLowerCase()] || CROP_NDVI_RANGES['default'];
        if (satellite_data.ndvi < cropRange.min * 0.7) {
            flags.push({
                type: 'crop_mismatch',
                severity: 'medium',
                details: `Declared ${farmer_input.crop_type} but vegetation index too low for healthy crop`,
                evidence: {
                    claimed: farmer_input.crop_type,
                    verified: `NDVI: ${satellite_data.ndvi.toFixed(2)}`,
                    discrepancy: `Expected >=${cropRange.min.toFixed(2)} for healthy ${farmer_input.crop_type}`
                },
                confidence: 65
            });
        }
    }

    // Check 4: Neighborhood anomaly for claims
    if (farmer_input.claimed_loss && nearby_farms && nearby_farms.length > 5) {
        const validLosses = nearby_farms.filter(f => f.claimed_loss !== undefined);
        if (validLosses.length > 3) {
            const avg_nearby_loss = validLosses.reduce((sum, f) => sum + (f.claimed_loss || 0), 0) / validLosses.length;
            if (farmer_input.claimed_loss > avg_nearby_loss * 2 && farmer_input.claimed_loss > 30) {
                flags.push({
                    type: 'claim_anomaly',
                    severity: 'high',
                    details: 'Claimed loss significantly higher than nearby farms',
                    evidence: {
                        claimed: `${farmer_input.claimed_loss}% loss`,
                        verified: `Nearby farms average: ${Math.round(avg_nearby_loss)}%`,
                        discrepancy: `${Math.round((farmer_input.claimed_loss / avg_nearby_loss - 1) * 100)}% higher than neighbors`
                    },
                    confidence: 80
                });
            }
        }
    }

    // Calculate fraud score
    const severityWeights: Record<string, number> = {
        low: 10,
        medium: 25,
        high: 40,
        critical: 60
    };

    const fraud_score = Math.min(100, flags.reduce((score, flag) => {
        return score + (severityWeights[flag.severity] * flag.confidence / 100);
    }, 0));

    // Determine recommendation
    let recommendation: 'approve' | 'field_verify' | 'reject';
    if (fraud_score > 60) {
        recommendation = 'reject';
    } else if (fraud_score > 30 || flags.some(f => f.severity === 'high' || f.severity === 'critical')) {
        recommendation = 'field_verify';
    } else {
        recommendation = 'approve';
    }

    return {
        fraud_score: Math.round(fraud_score),
        flags,
        recommendation
    };
}

// Calculate NDVI uniformity from satellite data (mock implementation)
export function calculateNDVIUniformity(ndviValues: number[]): number {
    if (ndviValues.length === 0) return 0;

    const mean = ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length;
    const variance = ndviValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / ndviValues.length;
    const stdDev = Math.sqrt(variance);

    // Uniformity is inverse of coefficient of variation
    const cv = stdDev / mean;
    return Math.max(0, Math.min(1, 1 - cv));
}

// Get trust score adjustment based on fraud history
export function calculateTrustScore(
    baseTrustScore: number,
    fraudFlags: FraudFlag[],
    previousClaimsAccuracy: number
): number {
    let score = baseTrustScore;

    // Decrease for fraud flags
    fraudFlags.forEach(flag => {
        switch (flag.severity) {
            case 'critical': score -= 20; break;
            case 'high': score -= 10; break;
            case 'medium': score -= 5; break;
            case 'low': score -= 2; break;
        }
    });

    // Increase for good claims history
    if (previousClaimsAccuracy > 0.9) {
        score += 10;
    } else if (previousClaimsAccuracy > 0.8) {
        score += 5;
    }

    return Math.max(0, Math.min(100, score));
}
