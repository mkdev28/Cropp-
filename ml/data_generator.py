import pandas as pd
import numpy as np
import random
from datetime import datetime

np.random.seed(42)
random.seed(42)

def generate_production_grade_data(n_samples=50000):
    """
    FINAL VERSION: Non-linear physics + complete feature set + realistic noise
    """
    
    print(f"🚀 Generating {n_samples} samples with advanced agronomic model...")
    
    data = []
    
    # === 1. STATE CONFIGURATIONS (Gamma-based rainfall) ===
    states = {
        'Maharashtra': {
            'base_rainfall': 1200, 'gamma_shape': 2.0, 'gamma_scale': 0.5,
            'fertility': 0.7, 'region_volatility': 0.3, 'base_temp': 28
        },
        'Punjab': {
            'base_rainfall': 600, 'gamma_shape': 3.5, 'gamma_scale': 0.3,
            'fertility': 0.9, 'region_volatility': 0.1, 'base_temp': 24
        },
        'Karnataka': {
            'base_rainfall': 900, 'gamma_shape': 2.0, 'gamma_scale': 0.5,
            'fertility': 0.65, 'region_volatility': 0.25, 'base_temp': 27
        },
        'Uttar Pradesh': {
            'base_rainfall': 1000, 'gamma_shape': 2.5, 'gamma_scale': 0.4,
            'fertility': 0.75, 'region_volatility': 0.2, 'base_temp': 26
        },
        'Rajasthan': {
            'base_rainfall': 400, 'gamma_shape': 1.5, 'gamma_scale': 0.6,
            'fertility': 0.50, 'region_volatility': 0.4, 'base_temp': 32
        },
        'Tamil Nadu': {
            'base_rainfall': 800, 'gamma_shape': 2.2, 'gamma_scale': 0.45,
            'fertility': 0.70, 'region_volatility': 0.3, 'base_temp': 29
        },
        'Madhya Pradesh': {
            'base_rainfall': 1100, 'gamma_shape': 2.0, 'gamma_scale': 0.5,
            'fertility': 0.68, 'region_volatility': 0.25, 'base_temp': 27
        },
    }

    # === 2. CROP RISK PROFILES ===
    crops = {
        'cotton': {
            'base_risk': 0.12, 'drought_sensitivity': 1.8, 'heat_sensitivity': 1.5,
            'water_need': 'high', 'growth_days': 150, 'optimal_temp': 28
        },
        'wheat': {
            'base_risk': 0.08, 'drought_sensitivity': 1.2, 'heat_sensitivity': 0.8,
            'water_need': 'medium', 'growth_days': 120, 'optimal_temp': 22
        },
        'rice': {
            'base_risk': 0.10, 'drought_sensitivity': 2.5, 'heat_sensitivity': 1.2,
            'water_need': 'very_high', 'growth_days': 140, 'optimal_temp': 26
        },
        'soybean': {
            'base_risk': 0.14, 'drought_sensitivity': 1.5, 'heat_sensitivity': 1.3,
            'water_need': 'medium', 'growth_days': 100, 'optimal_temp': 27
        },
        'sugarcane': {
            'base_risk': 0.05, 'drought_sensitivity': 1.1, 'heat_sensitivity': 0.9,
            'water_need': 'very_high', 'growth_days': 365, 'optimal_temp': 28
        },
        'maize': {
            'base_risk': 0.09, 'drought_sensitivity': 1.4, 'heat_sensitivity': 1.4,
            'water_need': 'medium', 'growth_days': 90, 'optimal_temp': 25
        },
        'pulses': {
            'base_risk': 0.07, 'drought_sensitivity': 0.8, 'heat_sensitivity': 0.7,
            'water_need': 'low', 'growth_days': 80, 'optimal_temp': 24
        },
    }

    # === 3. IRRIGATION EFFICIENCY (Non-Linear Mitigation) ===
    irrigation_efficiency = {
        'drip': 0.90,
        'sprinkler': 0.75,
        'canal': 0.60,
        'borewell': 0.50,
        'flood': 0.40,
        'rainfed': 0.0,
        'none': 0.0
    }
    
    irrigation_costs = {
        'drip': 50000, 'sprinkler': 35000, 'canal': 10000,
        'borewell': 80000, 'flood': 5000, 'rainfed': 0, 'none': 0
    }

    seasons = ['kharif', 'rabi']
    years = [2020, 2021, 2022, 2023, 2024]

    for i in range(n_samples):
        # === A. LOCATION & TEMPORAL ===
        state_name = random.choice(list(states.keys()))
        state_config = states[state_name]
        
        season = random.choice(seasons)
        year = random.choice(years)
        
        # Year-specific effects (2020 was bad, 2023 was good)
        year_quality = {'2020': 0.85, '2021': 0.95, '2022': 1.0, '2023': 1.05, '2024': 1.0}
        year_factor = year_quality[str(year)]
        
        # === B. RAINFALL (Gamma Distribution + Regional Variance) ===
        
        # Regional micro-climate (some districts get more/less rain)
        regional_factor = np.random.normal(1.0, state_config['region_volatility'])
        local_base_rainfall = state_config['base_rainfall'] * regional_factor * year_factor
        
        # Gamma distribution (realistic skew)
        gamma_sample = np.random.gamma(
            state_config['gamma_shape'],
            state_config['gamma_scale']
        )
        # Normalize: E[Gamma(k,θ)] = k*θ, so divide by expected value
        gamma_normalized = gamma_sample / (state_config['gamma_shape'] * state_config['gamma_scale'])
        
        actual_rainfall_mm = local_base_rainfall * gamma_normalized
        rainfall_deficit_pct = (local_base_rainfall - actual_rainfall_mm) / local_base_rainfall
        
        # Monsoon reliability (inverse of coefficient of variation)
        monsoon_reliability = np.clip(1 - abs(rainfall_deficit_pct), 0, 1)
        
        # === C. TEMPERATURE ===
        
        # Season affects temperature
        temp_adjustment = 5 if season == 'kharif' else -3
        avg_temp = state_config['base_temp'] + temp_adjustment
        
        # Heatwave simulation (Poisson process)
        heatwave_rate = 0.3 if avg_temp > 30 else 0.1
        heatwave_days = np.random.poisson(heatwave_rate * 15)  # Over 90-day season
        
        # === D. FARM CHARACTERISTICS ===
        
        crop_name = random.choice(list(crops.keys()))
        crop_config = crops[crop_name]
        
        # Land size (log-normal is correct)
        land_acres = np.clip(np.random.lognormal(1.5, 0.8), 0.5, 50)
        
        # Farmer wealth (determines infrastructure)
        # Influenced by land size (larger farmers are richer)
        base_wealth = np.random.beta(2, 5)
        wealth_from_land = np.clip(land_acres / 20, 0, 0.3)
        farmer_wealth = np.clip(base_wealth + wealth_from_land, 0, 1)
        
        # Irrigation (wealth-dependent)
        if farmer_wealth > 0.7:
            irrigation_type = random.choice(['drip', 'sprinkler', 'canal'])
        elif farmer_wealth > 0.4:
            irrigation_type = random.choice(['canal', 'borewell', 'flood'])
        else:
            irrigation_type = random.choice(['rainfed', 'rainfed', 'none'])
        
        # Water sources (correlated with irrigation)
        if irrigation_type in ['drip', 'sprinkler']:
            water_source_count = np.random.choice([2, 3, 4], p=[0.5, 0.3, 0.2])
            borewell_count = np.random.choice([1, 2, 3], p=[0.5, 0.3, 0.2])
            borewell_depth_ft = np.clip(np.random.normal(150, 40), 50, 300)
            has_canal_access = np.random.random() > 0.6
        elif irrigation_type == 'borewell':
            water_source_count = np.random.choice([1, 2], p=[0.7, 0.3])
            borewell_count = water_source_count
            borewell_depth_ft = np.clip(np.random.normal(100, 30), 50, 250)
            has_canal_access = False
        elif irrigation_type in ['canal', 'flood']:
            water_source_count = 1
            borewell_count = 0
            borewell_depth_ft = 0
            has_canal_access = True
        else:  # rainfed
            water_source_count = 0
            borewell_count = 0
            borewell_depth_ft = 0
            has_canal_access = False
        
        # Diversification (larger/richer farmers diversify)
        if land_acres > 10 and farmer_wealth > 0.5:
            crop_count = np.random.choice([2, 3], p=[0.6, 0.4])
        elif land_acres > 5:
            crop_count = np.random.choice([1, 2], p=[0.5, 0.5])
        else:
            crop_count = 1
        
        has_livestock = farmer_wealth > 0.4 and np.random.random() > 0.5
        livestock_count = np.random.poisson(3) if has_livestock else 0
        
        # Assets
        owns_tractor = farmer_wealth > 0.6 and land_acres > 5
        has_storage = farmer_wealth > 0.5 and np.random.random() > 0.4
        
        # === E. FINANCIAL HEALTH ===
        
        # KCC score (300-900 scale, like CIBIL)
        kcc_base = 500 + farmer_wealth * 300
        kcc_score = np.clip(np.random.normal(kcc_base, 60), 300, 900)
        
        # Repayment rate (poor farmers struggle)
        base_repayment = 60 + (kcc_score - 300) / 600 * 35  # 60-95%
        kcc_repayment_rate = np.clip(np.random.normal(base_repayment, 10), 40, 100)
        
        # Debt (inversely correlated with wealth)
        outstanding_debt_ratio = np.clip(
            np.random.beta(2, 3) * (1.5 - farmer_wealth),
            0, 2
        )
        
        has_insurance_history = kcc_score > 600 and np.random.random() > 0.4
        
        # === F. SOIL & SATELLITE DATA ===
        
        # Soil fertility (state baseline + noise)
        soil_fertility_index = np.clip(
            state_config['fertility'] * np.random.normal(1.0, 0.15),
            0.2, 1.0
        )
        
        # Soil moisture (function of rainfall + irrigation)
        base_moisture = 50 + (actual_rainfall_mm - 800) / 20
        irrigation_moisture_bonus = irrigation_efficiency[irrigation_type] * 20
        soil_moisture_percent = np.clip(
            base_moisture + irrigation_moisture_bonus + np.random.normal(0, 5),
            10, 95
        )
        
        # NDVI (vegetation health - with noise to prevent leakage)
        expected_ndvi_base = 0.5
        
        # Irrigation boosts NDVI
        if irrigation_type in ['drip', 'sprinkler']:
            expected_ndvi_base += 0.25
        elif irrigation_type in ['canal', 'borewell', 'flood']:
            expected_ndvi_base += 0.15
        
        # Rainfall affects NDVI (non-linear)
        if rainfall_deficit_pct > 0:  # Drought
            ndvi_drought_penalty = rainfall_deficit_pct * 0.6
            expected_ndvi_base -= ndvi_drought_penalty
        else:  # Excess (mild benefit, then flooding harm)
            if abs(rainfall_deficit_pct) < 0.2:
                expected_ndvi_base += abs(rainfall_deficit_pct) * 0.2
            else:
                expected_ndvi_base -= abs(rainfall_deficit_pct) * 0.3  # Flooding
        
        # Add noise (cloud cover, weeds, sensor error)
        ndvi_score = np.clip(expected_ndvi_base + np.random.normal(0, 0.1), 0.1, 0.9)
        
        # Pest attack (independent random event)
        pest_attack = np.random.random() < 0.12
        if pest_attack:
            ndvi_score -= 0.15
            ndvi_score = max(0.1, ndvi_score)
        
        # === G. NON-LINEAR RISK CALCULATION ===
        
        # 1. Weather Stress (Exponential Curve)
        if rainfall_deficit_pct > 0:  # Drought
            drought_stress = (1 + rainfall_deficit_pct) ** 2.5
        else:  # Flooding
            drought_stress = 1 + (abs(rainfall_deficit_pct) ** 1.5) * 0.5
        
        # 2. Heat Stress (Deviation from optimal temp)
        temp_deviation = abs(avg_temp - crop_config['optimal_temp'])
        heat_stress = 1 + (temp_deviation / 10) ** 1.5 * crop_config['heat_sensitivity']
        if heatwave_days > 10:
            heat_stress *= 1.3
        
        # 3. Combined Weather Stress
        weather_stress = drought_stress * heat_stress
        
        # 4. Irrigation Mitigation (Multiplicative Interaction)
        mitigation_power = irrigation_efficiency[irrigation_type]
        
        # Water source redundancy adds resilience
        if water_source_count >= 3:
            mitigation_power = min(0.95, mitigation_power + 0.05)
        elif water_source_count == 2:
            mitigation_power = min(0.95, mitigation_power + 0.03)
        
        # Deep borewells are more reliable
        if borewell_depth_ft > 150:
            mitigation_power = min(0.95, mitigation_power + 0.02)
        
        exposure_factor = 1.0 - mitigation_power
        
        # 5. Soil Quality Effect
        soil_stress = 1.0 + (1 - soil_fertility_index) * 0.3
        
        # 6. Financial Stress (Poor farmers cut corners)
        if kcc_repayment_rate < 60:
            financial_stress = 1.15  # Can't afford inputs
        elif outstanding_debt_ratio > 1.0:
            financial_stress = 1.10
        else:
            financial_stress = 1.0
        
        # 7. Diversification Protection
        if crop_count >= 3:
            diversification_protection = 0.85
        elif crop_count == 2:
            diversification_protection = 0.92
        else:
            diversification_protection = 1.0
        
        if has_livestock:
            diversification_protection *= 0.95
        
        # 8. COMBINE ALL FACTORS (Non-Linear Multiplication)
        agronomic_risk = (
            crop_config['base_risk'] *
            (1 + (weather_stress - 1) * exposure_factor * crop_config['drought_sensitivity']) *
            soil_stress *
            financial_stress *
            diversification_protection
        )
        
        # Pest attack (independent additive shock)
        if pest_attack:
            agronomic_risk *= 1.35
        
        # Clip to probability range
        claim_probability_true = np.clip(agronomic_risk, 0.01, 0.95)
        
        # === H. OUTCOME SIMULATION ===
        
        # 1. Did actual crop loss occur?
        loss_event_occurred = np.random.random() < claim_probability_true
        
        # 2. Fraud layer (3% fraud rate, independent of loss)
        is_fraudster = np.random.random() < 0.03
        
        # 3. Insurance coverage
        has_insurance = kcc_score > 550 and np.random.random() > 0.3
        
        # 4. Claim filing decision
        claim_filed = False
        
        if is_fraudster and has_insurance:
            claim_filed = True
        elif loss_event_occurred and has_insurance:
            # 92% file if they suffered loss
            if np.random.random() < 0.92:
                claim_filed = True
        
        # 5. Loss severity & payout
        loss_percent = 0
        payout_amount = 0
        sum_insured = land_acres * 40000  # ₹40k per acre
        
        if claim_filed:
            if is_fraudster:
                # Fraudsters exaggerate (50-95% loss claims)
                loss_percent = np.random.uniform(50, 95)
                payout_amount = sum_insured * (loss_percent / 100)
            else:
                # Real loss severity (correlated with weather stress)
                severity_factor = np.clip((weather_stress - 1) / 3, 0.1, 0.9)
                loss_percent = severity_factor * 100
                payout_amount = sum_insured * severity_factor
        
        # === I. STORE RECORD ===
        
        record = {
            # Identifiers
            'farmer_id': f'F{i:06d}',
            'state': state_name,
            'season': season,
            'year': year,
            
            # Farm characteristics
            'land_acres': round(land_acres, 2),
            'crop_type': crop_name,
            'irrigation_type': irrigation_type,
            'water_source_count': water_source_count,
            'borewell_count': borewell_count,
            'borewell_depth_ft': round(borewell_depth_ft, 1),
            'has_canal_access': int(has_canal_access),
            'crop_count': crop_count,
            'has_livestock': int(has_livestock),
            'livestock_count': livestock_count,
            'owns_tractor': int(owns_tractor),
            'has_storage': int(has_storage),
            
            # Financial
            'kcc_score': int(kcc_score),
            'kcc_repayment_rate': round(kcc_repayment_rate, 1),
            'outstanding_debt_ratio': round(outstanding_debt_ratio, 3),
            'has_insurance_history': int(has_insurance_history),
            
            # Weather
            'region_rainfall_baseline': round(local_base_rainfall, 1),
            'actual_rainfall_mm': round(actual_rainfall_mm, 1),
            'rainfall_deficit_pct': round(rainfall_deficit_pct, 3),
            'heatwave_days': heatwave_days,
            'avg_temperature_c': round(avg_temp, 1),
            'monsoon_reliability': round(monsoon_reliability, 3),
            
            # Satellite/Soil
            'ndvi_score': round(ndvi_score, 3),
            'soil_moisture_percent': round(soil_moisture_percent, 1),
            'soil_fertility_index': round(soil_fertility_index, 3),
            
            # Hidden variables (for testing model robustness)
            'pest_attack_flag': int(pest_attack),
            'farmer_wealth_hidden': round(farmer_wealth, 3),
            
            # Target variables
            'claim_probability_true': round(claim_probability_true, 4),
            'claim_filed': int(claim_filed),
            'loss_percent': round(loss_percent, 1),
            'payout_amount': round(payout_amount, 2),
            'is_fraud': int(is_fraudster),
            
            # Metadata
            'sum_insured': sum_insured,
            'district_avg_premium': 5000,
        }
        
        data.append(record)
    
    df = pd.DataFrame(data)
    
    # === J. ADD REALISTIC MISSING VALUES ===
    
    # 5% missing borewell depth (farmers don't know exact depth)
    missing_borewell = np.random.choice(df.index, size=int(len(df)*0.05), replace=False)
    df.loc[missing_borewell, 'borewell_depth_ft'] = np.nan
    
    # 3% missing NDVI (cloud cover during satellite pass)
    missing_ndvi = np.random.choice(df.index, size=int(len(df)*0.03), replace=False)
    df.loc[missing_ndvi, 'ndvi_score'] = np.nan
    
    # 2% missing soil moisture (sensor failure)
    missing_soil = np.random.choice(df.index, size=int(len(df)*0.02), replace=False)
    df.loc[missing_soil, 'soil_moisture_percent'] = np.nan
    
    # Save
    df.to_csv('data/production_farm_insurance_data.csv', index=False)
    
    print(f"\n✅ Generated {len(df)} records")
    print(f"📊 Claim rate: {df['claim_filed'].mean()*100:.2f}%")
    print(f"🚨 Fraud rate: {df['is_fraud'].mean()*100:.2f}%")
    
    # FIX: Add '== 1' to make it a boolean filter
    claimed_mask = df['claim_filed'] == 1
    print(f"💰 Avg loss when claimed: ₹{df[claimed_mask]['payout_amount'].mean():,.0f}")
    print(f"📈 Avg loss %: {df[claimed_mask]['loss_percent'].mean():.1f}%")
    
    print("\n🔍 Sample distribution:")
    # Fix: Ensure we are selecting columns correctly
    print(df[['state', 'irrigation_type', 'rainfall_deficit_pct', 'claim_filed', 'is_fraud']].head(10))
    
    print("\n📂 Saved to: data/production_farm_insurance_data.csv")
    
    return df
    
    print("\n🔍 Sample distribution:")
    print(df[['state', 'irrigation_type', 'rainfall_deficit_pct', 'claim_filed', 'is_fraud']].head(10))
    
    print("\n📂 Saved to: data/production_farm_insurance_data.csv")
    
    return df

if __name__ == '__main__':
    df = generate_production_grade_data(50000)
    
    # Quick validation
    print("\n📊 Feature Statistics:")
    print(df[['rainfall_deficit_pct', 'ndvi_score', 'claim_probability_true', 'loss_percent']].describe())
    
    # Check correlations
    print("\n🔗 Key Correlations:")
    print(df[['rainfall_deficit_pct', 'ndvi_score', 'claim_filed']].corr())