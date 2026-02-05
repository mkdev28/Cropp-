import pandas as pd
import numpy as np
from catboost import CatBoostClassifier, Pool
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.metrics import (
    roc_auc_score, classification_report, confusion_matrix, 
    brier_score_loss, precision_recall_curve
)
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
import joblib
import json
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Tuple, Dict, List
import warnings
warnings.filterwarnings('ignore')

class ProductionAgriRiskModel:
    """
    Production-Grade CatBoost Model with Calibration, Cross-Validation, and Explainability
    """
    
    def __init__(self):
        self.model = None
        self.calibrated_model = None
        self.feature_names = None
        self.categorical_features = None
        self.numerical_features = None
        self.metrics = {}
        self.feature_importance = {}
        
    def prepare_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str], List[str]]:
        """
        Advanced Feature Engineering with Domain Knowledge
        """
        df = df.copy()
        
        # === 1. INTERACTION FEATURES (Non-Linear Relationships) ===
        
        # Irrigation is MORE valuable during drought (multiplicative)
        df['irrigation_x_drought'] = (
            df['irrigation_type'].isin(['drip', 'sprinkler']).astype(int) * 
            np.clip(df['rainfall_deficit_pct'], 0, 1)  # Only positive deficits
        )
        
        # Assets matter more for large farms
        df['tractor_x_land'] = df['owns_tractor'].astype(int) * np.log1p(df['land_acres'])
        
        # Financial stress amplifies weather risk
        df['debt_x_drought'] = (
            df['outstanding_debt_ratio'] * 
            np.clip(df['rainfall_deficit_pct'], 0, 1)
        )
        
        # Multiple crops protect against weather (diversification × weather)
        df['diversification_x_weather'] = (
            np.clip(df['crop_count'], 1, 3) * 
            (1 - np.clip(abs(df['rainfall_deficit_pct']), 0, 1))
        )
        
        # === 2. DOMAIN INDICES (Composite Scores) ===
        
        # Water Security Index (0-1 scale)
        irrigation_scores = {
            'drip': 0.95, 'sprinkler': 0.85, 'canal': 0.70,
            'borewell': 0.60, 'flood': 0.50, 'rainfed': 0.0, 'none': 0.0
        }
        df['irrigation_score'] = df['irrigation_type'].map(irrigation_scores).fillna(0)
        
        df['water_security_index'] = (
            df['irrigation_score'] * 0.5 +
            np.clip(df['water_source_count'] / 4, 0, 1) * 0.3 +
            np.clip(df['borewell_depth_ft'] / 200, 0, 1) * 0.2
        )
        
        # Financial Health Index (0-1 scale)
        df['financial_health_index'] = np.clip(
            (df['kcc_repayment_rate'] / 100) * 0.6 +
            (1 - np.clip(df['outstanding_debt_ratio'], 0, 1.5) / 1.5) * 0.4,
            0, 1
        )
        
        # Diversification Index (0-1 scale)
        df['diversification_index'] = np.clip(
            np.clip(df['crop_count'] / 3, 0, 1) * 0.6 +
            df['has_livestock'].astype(int) * 0.4,
            0, 1
        )
        
        # Weather Stress Index (0-1 scale, higher = worse)
        df['weather_stress_index'] = np.clip(
            abs(df['rainfall_deficit_pct']) * 0.6 +
            np.clip(df['heatwave_days'] / 20, 0, 1) * 0.4,
            0, 1
        )
        
        # Vegetation Health Score (0-100)
        df['vegetation_health_score'] = df['ndvi_score'] * 100
        
        # Soil Quality Score (0-100)
        df['soil_quality_score'] = (
            df['soil_fertility_index'] * 0.6 +
            df['soil_moisture_percent'] / 100 * 0.4
        ) * 100
        
        # === 3. RISK FLAGS (Binary Indicators) ===
        
        df['is_rainfed'] = df['irrigation_type'].isin(['rainfed', 'none']).astype(int)
        df['is_high_risk_crop'] = df['crop_type'].isin(['cotton', 'rice', 'soybean']).astype(int)
        df['is_marginal_farmer'] = (df['land_acres'] < 2.5).astype(int)
        df['is_single_crop'] = (df['crop_count'] == 1).astype(int)
        df['has_deep_borewell'] = (df['borewell_depth_ft'] > 150).astype(int)
        df['is_drought_year'] = (df['rainfall_deficit_pct'] > 0.3).astype(int)
        df['is_flood_year'] = (df['rainfall_deficit_pct'] < -0.3).astype(int)
        df['has_financial_stress'] = (
            (df['kcc_repayment_rate'] < 60) | 
            (df['outstanding_debt_ratio'] > 1.0)
        ).astype(int)
        
        # === 4. TEMPORAL FEATURES ===
        
        # Year as ordinal (model can learn trends)
        df['year_ordinal'] = df['year'] - df['year'].min()
        
        # Season encoding (kharif = monsoon-dependent)
        df['is_kharif_season'] = (df['season'] == 'kharif').astype(int)
        
        # === 5. STATISTICAL AGGREGATIONS (Regional Context) ===
        
        # State-level rainfall deviation (am I worse than state average?)
        state_rainfall_mean = df.groupby('state')['actual_rainfall_mm'].transform('mean')
        df['rainfall_deviation_from_state'] = (
            df['actual_rainfall_mm'] - state_rainfall_mean
        ) / state_rainfall_mean
        
        # === FEATURE SELECTION ===
        
        numerical_features = [
            # Core physics
            'land_acres', 'actual_rainfall_mm', 'rainfall_deficit_pct',
            'heatwave_days', 'monsoon_reliability',
            
            # Satellite/Soil
            'ndvi_score', 'soil_moisture_percent', 'soil_fertility_index',
            'vegetation_health_score', 'soil_quality_score',
            
            # Infrastructure
            'water_source_count', 'borewell_count', 'borewell_depth_ft',
            'crop_count', 'livestock_count',
            
            # Financial
            'kcc_score', 'kcc_repayment_rate', 'outstanding_debt_ratio',
            
            # Engineered indices
            'water_security_index', 'financial_health_index',
            'diversification_index', 'weather_stress_index',
            'irrigation_score',
            
            # Interactions
            'irrigation_x_drought', 'tractor_x_land',
            'debt_x_drought', 'diversification_x_weather',
            'rainfall_deviation_from_state',
            
            # Temporal
            'year_ordinal',
            
            # Flags
            'is_rainfed', 'is_high_risk_crop', 'is_marginal_farmer',
            'is_single_crop', 'has_deep_borewell', 'is_drought_year',
            'is_flood_year', 'has_financial_stress', 'is_kharif_season',
            'owns_tractor', 'has_storage', 'has_livestock',
            'has_canal_access', 'has_insurance_history',
        ]
        
        categorical_features = ['state', 'crop_type', 'irrigation_type', 'season']
        
        feature_columns = numerical_features + categorical_features
        
        # === SMART MISSING VALUE HANDLING ===
        
        # Conditional imputation (context-aware)
        for col in numerical_features:
            if col == 'borewell_depth_ft':
                # If rainfed, depth = 0 (not median)
                df.loc[df['irrigation_type'].isin(['rainfed', 'none']), col] = 0
                df[col] = df[col].fillna(df[col].median())
            
            elif col == 'borewell_count':
                df.loc[df['irrigation_type'].isin(['rainfed', 'none']), col] = 0
                df[col] = df[col].fillna(0)
            
            elif col in ['ndvi_score', 'soil_moisture_percent']:
                # Satellite data can be missing (cloud cover)
                # Use state-level median for region
                df[col] = df.groupby('state')[col].transform(
                    lambda x: x.fillna(x.median())
                )
            
            else:
                # Standard median imputation
                df[col] = df[col].fillna(df[col].median())
        
        # Categorical: mode imputation
        for col in categorical_features:
            df[col] = df[col].fillna(df[col].mode()[0])
        
        return df[feature_columns], feature_columns, categorical_features
    
    def train(self, df: pd.DataFrame, target_col='claim_filed', use_cv=False):
        """
        Train with 3-way split for proper calibration
        """
        print("🔧 Engineering features...")
        X, feature_names, categorical_features = self.prepare_features(df)
        y = df[target_col].values
        
        self.feature_names = feature_names
        self.categorical_features = categorical_features
        self.numerical_features = [f for f in feature_names if f not in categorical_features]
        
        print(f"📊 Dataset: {len(X):,} samples")
        print(f"📊 Features: {len(feature_names)} ({len(categorical_features)} categorical)")
        print(f"📊 Claim rate: {y.mean()*100:.2f}%")
        
        # === FIX: 3-WAY SPLIT (Train / Validation / Test) ===
        
        # First split: 70% train, 30% temp
        X_train, X_temp, y_train, y_temp = train_test_split(
            X, y, test_size=0.3, stratify=y, random_state=42
        )
        
        # Second split: 15% validation (early stopping), 15% test (calibration)
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=42
        )
        
        print(f"\n📦 Train: {len(X_train):,} | Validation: {len(X_val):,} | Test: {len(X_test):,}")
        
        # === CATBOOST TRAINING ===
        
        print("\n🚀 Training CatBoost...")
        
        cat_feature_indices = [i for i, col in enumerate(feature_names) 
                               if col in categorical_features]
        
        train_pool = Pool(X_train, y_train, cat_features=cat_feature_indices)
        val_pool = Pool(X_val, y_val, cat_features=cat_feature_indices)
        test_pool = Pool(X_test, y_test, cat_features=cat_feature_indices)
        
        self.model = CatBoostClassifier(
            iterations=2000,
            learning_rate=0.03,
            depth=6,
            l2_leaf_reg=3,
            loss_function='Logloss',
            eval_metric='AUC',
            auto_class_weights='Balanced',  # Handle 15-20% claim rate imbalance
            early_stopping_rounds=150,
            random_seed=42,
            verbose=200,
            task_type='CPU',  # Change to GPU if available
        )
        
        self.model.fit(
            train_pool,
            eval_set=val_pool,  # Early stopping on VALIDATION set
            plot=False
        )
        
        # === PROBABILITY CALIBRATION ===
        
        print("\n⚖️ Calibrating probabilities (isotonic regression)...")
        
        # Calibrate on TEST set (held-out, never seen during training)
        print("\n⚖️ Calibrating probabilities (isotonic regression)...")
        try:
            # FIX: Explicitly use 'estimator=' keyword argument
            self.calibrated_model = CalibratedClassifierCV(
                estimator=self.model, 
                cv='prefit',
                method='isotonic'
            )
            self.calibrated_model.fit(X_test, y_test)
        except Exception as e:
            print(f"⚠️ Calibration failed ({e}). using raw model instead.")
            self.calibrated_model = self.model # Fallback to raw model
        
        # === EVALUATION ===
        
        print("\n📈 Final Evaluation (on Test Set):")
        
        # Get calibrated probabilities
        y_prob = self.calibrated_model.predict_proba(X_test)[:, 1]
        y_pred = (y_prob >= 0.5).astype(int)
        
        # Metrics
        auc = roc_auc_score(y_test, y_prob)
        brier = brier_score_loss(y_test, y_prob)
        
        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel()
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        self.metrics = {
            'auc': float(auc),
            'brier_score': float(brier),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'accuracy': float((tp + tn) / (tp + tn + fp + fn)),
        }
        
        print(f"✅ AUC-ROC: {auc:.4f}")
        print(f"✅ Brier Score: {brier:.4f} (lower is better)")
        print(f"✅ Precision: {precision:.4f}")
        print(f"✅ Recall: {recall:.4f}")
        print(f"✅ F1 Score: {f1:.4f}")
        
        print("\n📊 Confusion Matrix:")
        print(f"    Predicted No | Predicted Yes")
        print(f"Actual No:  {tn:>5} | {fp:>5}")
        print(f"Actual Yes: {fn:>5} | {tp:>5}")
        
        # === FEATURE IMPORTANCE ===
        
        feature_importance = self.model.get_feature_importance(train_pool)
        self.feature_importance = dict(zip(feature_names, feature_importance))
        
        sorted_features = sorted(
            self.feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        print("\n🔝 Top 15 Most Important Features:")
        for i, (feat, importance) in enumerate(sorted_features[:15], 1):
            print(f"{i:2d}. {feat:.<40} {importance:>6.2f}")
        
        # === VISUALIZATION ===
        
        self._plot_feature_importance()
        self._plot_calibration_curve(y_test, y_prob)
        
        return self.metrics
    
    def _plot_feature_importance(self):
        """Generate feature importance chart"""
        sorted_features = sorted(
            self.feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )[:15]
        
        features, importances = zip(*sorted_features)
        
        plt.figure(figsize=(12, 8))
        plt.barh(range(len(features)), importances, color='steelblue')
        plt.yticks(range(len(features)), features)
        plt.xlabel('Feature Importance', fontsize=12)
        plt.title('Top 15 Risk Drivers (CatBoost Feature Importance)', fontsize=14, fontweight='bold')
        plt.gca().invert_yaxis()
        plt.tight_layout()
        plt.savefig('feature_importance.png', dpi=300)
        print("\n📊 Saved: feature_importance.png")
        plt.close()
    
    def _plot_calibration_curve(self, y_true, y_prob):
        """Plot calibration curve (reliability diagram)"""
        fraction_of_positives, mean_predicted_value = calibration_curve(
            y_true, y_prob, n_bins=10
        )
        
        plt.figure(figsize=(8, 8))
        plt.plot(mean_predicted_value, fraction_of_positives, "s-", label='Model')
        plt.plot([0, 1], [0, 1], "k--", label='Perfect Calibration')
        plt.xlabel('Predicted Probability', fontsize=12)
        plt.ylabel('True Probability', fontsize=12)
        plt.title('Probability Calibration Curve', fontsize=14, fontweight='bold')
        plt.legend()
        plt.grid(alpha=0.3)
        plt.tight_layout()
        plt.savefig('calibration_curve.png', dpi=300)
        print("📊 Saved: calibration_curve.png")
        plt.close()
    
    def predict_risk_score(self, farm_data: Dict) -> Dict:
        """
        API-ready prediction with breakdown
        """
        if self.calibrated_model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        # Convert to DataFrame
        input_df = pd.DataFrame([farm_data])
        
        # Prepare features
        X_processed, _, _ = self.prepare_features(input_df)
        
        # Get calibrated probability
        prob_claim = self.calibrated_model.predict_proba(X_processed)[0, 1]
        
        # Risk score (0-100, higher = safer)
        risk_score = int(np.clip((1 - prob_claim) * 100, 0, 100))
        
        # Category
        if risk_score >= 75:
            risk_category = 'low'
            category_label = 'Low Risk (Safe)'
        elif risk_score >= 50:
            risk_category = 'medium'
            category_label = 'Moderate Risk'
        elif risk_score >= 25:
            risk_category = 'high'
            category_label = 'High Risk'
        else:
            risk_category = 'high'
            category_label = 'Critical Risk'
        
        # SHAP values (feature contributions)
        cat_feature_indices = [i for i, col in enumerate(self.feature_names) 
                               if col in self.categorical_features]
        
        pool = Pool(X_processed, cat_features=cat_feature_indices)
        shap_values = self.model.get_feature_importance(pool, type='ShapValues')
        
        # Extract contributions (last column is bias)
        contributions = shap_values[0, :-1]
        
        # === MAP TO BUSINESS CATEGORIES ===
        
        breakdown = self._calculate_breakdown(contributions)
        
        # Top risk factors (positive SHAP = increases risk)
        feature_impacts = list(zip(self.feature_names, contributions))
        risk_drivers = sorted(
            [(f, c) for f, c in feature_impacts if c > 0],
            key=lambda x: x[1],
            reverse=True
        )[:3]
        
        protective_factors = sorted(
            [(f, abs(c)) for f, c in feature_impacts if c < 0],
            key=lambda x: x[1],
            reverse=True
        )[:3]
        
        return {
            'farmer_id': farm_data.get('farmer_id', 'Unknown'),
            'risk_score': risk_score,
            'risk_category': risk_category,
            'category_label': category_label,
            'claim_probability': round(prob_claim * 100, 2),
            'confidence': 'high',  # Can add logic based on data completeness
            'breakdown': breakdown,
            'top_risk_drivers': [
                {'factor': f, 'impact': round(c, 3)} for f, c in risk_drivers
            ],
            'top_protective_factors': [
                {'factor': f, 'impact': round(c, 3)} for f, c in protective_factors
            ]
        }
    
    def _calculate_breakdown(self, contributions: np.ndarray) -> Dict:
        """
        Map SHAP values to interpretable categories (0-25 scale)
        """
        # Group features by category
        weather_features = [
            'rainfall_deficit_pct', 'heatwave_days', 'actual_rainfall_mm',
            'monsoon_reliability', 'weather_stress_index', 'is_drought_year',
            'is_flood_year', 'rainfall_deviation_from_state'
        ]
        
        infrastructure_features = [
            'irrigation_type', 'water_source_count', 'borewell_depth_ft',
            'borewell_count', 'has_canal_access', 'water_security_index',
            'irrigation_score', 'is_rainfed', 'has_deep_borewell',
            'irrigation_x_drought'
        ]
        
        diversification_features = [
            'crop_count', 'has_livestock', 'livestock_count', 'crop_type',
            'diversification_index', 'is_single_crop', 'is_high_risk_crop',
            'diversification_x_weather'
        ]
        
        financial_features = [
            'kcc_score', 'kcc_repayment_rate', 'outstanding_debt_ratio',
            'has_insurance_history', 'financial_health_index',
            'has_financial_stress', 'debt_x_drought'
        ]
        
        # Sum SHAP contributions by category
        weather_shap = sum(
            contributions[i] for i, f in enumerate(self.feature_names)
            if f in weather_features
        )
        
        infra_shap = sum(
            contributions[i] for i, f in enumerate(self.feature_names)
            if f in infrastructure_features
        )
        
        div_shap = sum(
            contributions[i] for i, f in enumerate(self.feature_names)
            if f in diversification_features
        )
        
        fin_shap = sum(
            contributions[i] for i, f in enumerate(self.feature_names)
            if f in financial_features
        )
        
        # Normalize to 0-25 scale (inverse for weather risk)
        total_abs = abs(weather_shap) + abs(infra_shap) + abs(div_shap) + abs(fin_shap)
        
        if total_abs > 0:
            # Weather: negative SHAP = good (low risk), so invert
            weather_risk = int(np.clip(12.5 - (weather_shap / total_abs * 12.5), 0, 25))
            infrastructure = int(np.clip(12.5 + (infra_shap / total_abs * 12.5), 0, 25))
            diversification = int(np.clip(12.5 + (div_shap / total_abs * 12.5), 0, 25))
            financial_health = int(np.clip(12.5 + (fin_shap / total_abs * 12.5), 0, 25))
        else:
            weather_risk = 12
            infrastructure = 12
            diversification = 12
            financial_health = 12
        
        return {
            'weather_risk': weather_risk,
            'infrastructure': infrastructure,
            'diversification': diversification,
            'financial_health': financial_health
        }
    
    def save(self, path='models/agri_risk_model_v3.pkl'):
        """Save complete model"""
        joblib.dump(self, path)
        
        # Save metadata
        metadata = {
            'feature_names': self.feature_names,
            'categorical_features': self.categorical_features,
            'numerical_features': self.numerical_features,
            'metrics': self.metrics,
            'feature_importance': {k: float(v) for k, v in self.feature_importance.items()},
        }
        
        metadata_path = path.replace('.pkl', '_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"\n✅ Model saved: {path}")
        print(f"✅ Metadata saved: {metadata_path}")
    
    @staticmethod
    def load(path='models/agri_risk_model_v3.pkl'):
        """Load trained model"""
        model = joblib.load(path)
        print(f"✅ Model loaded: {path}")
        print(f"📊 Model AUC: {model.metrics['auc']:.4f}")
        print(f"📊 Brier Score: {model.metrics['brier_score']:.4f}")
        return model


# === MAIN TRAINING SCRIPT ===

if __name__ == '__main__':
    print("="*60)
    print(" AGRI-RISK PRO - PRODUCTION MODEL TRAINING")
    print("="*60)
    
    # 1. Load data
    print("\n📂 Loading training data...")
    try:
        df = pd.read_csv('data/production_farm_insurance_data.csv')
        print(f"✅ Loaded {len(df):,} records")
    except FileNotFoundError:
        print("❌ Error: 'data/production_farm_insurance_data.csv' not found")
        print("   Run the data generation script first!")
        exit(1)
    
    # 2. Initialize model
    model = ProductionAgriRiskModel()
    
    # 3. Train
    metrics = model.train(df, target_col='claim_filed')
    
    # 4. Save
    model.save('models/agri_risk_model_v3.pkl')
    
    # 5. Test prediction
    print("\n" + "="*60)
    print(" TESTING API PREDICTION")
    print("="*60)
    
    # Get a random high-risk and low-risk farm
    high_risk_idx = df[df['claim_filed'] == 1].sample(1).index[0]
    low_risk_idx = df[df['claim_filed'] == 0].sample(1).index[0]
    
    print("\n🔴 HIGH RISK FARM:")
    high_risk_farm = df.iloc[high_risk_idx].to_dict()
    prediction = model.predict_risk_score(high_risk_farm)
    print(json.dumps(prediction, indent=2))
    
    print("\n🟢 LOW RISK FARM:")
    low_risk_farm = df.iloc[low_risk_idx].to_dict()
    prediction = model.predict_risk_score(low_risk_farm)
    print(json.dumps(prediction, indent=2))
    
    print("\n✅ Training complete!")