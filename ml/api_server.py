#!/usr/bin/env python3
"""
FastAPI server for AgriRisk ML model
Run: uvicorn ml.api_server:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import joblib
import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from ml.train_model import ProductionAgriRiskModel

# === FASTAPI APP ===

app = FastAPI(
    title="AgriRisk Pro ML API",
    description="Farm-level insurance risk prediction",
    version="1.0.0"
)

# CORS (allow Next.js to call this)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === LOAD MODEL (Once at startup) ===

MODEL_PATH = "models/agri_risk_model_v3.pkl"
model: Optional[ProductionAgriRiskModel] = None

@app.on_event("startup")
async def load_model():
    global model
    try:
        print(f"🔄 Loading model from {MODEL_PATH}...")
        model = ProductionAgriRiskModel.load(MODEL_PATH)
        print("✅ Model loaded successfully")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        model = None

# === PYDANTIC SCHEMAS ===

class PredictionInput(BaseModel):
    # Location
    state: str
    season: str = Field(..., pattern="^(kharif|rabi)$")
    year: Optional[int] = 2024
    
    # Farm characteristics
    crop_type: str
    land_acres: float = Field(..., gt=0)
    irrigation_type: str
    water_source_count: int = Field(..., ge=0)
    borewell_count: Optional[int] = 0
    borewell_depth_ft: float = Field(..., ge=0)
    has_canal_access: Optional[bool] = False
    crop_count: int = Field(..., ge=1)
    has_livestock: bool
    livestock_count: int = Field(..., ge=0)
    owns_tractor: Optional[bool] = False
    has_storage: Optional[bool] = False
    
    # Financial
    kcc_score: Optional[int] = Field(default=700, ge=300, le=900)
    kcc_repayment_rate: float = Field(..., ge=0, le=100)
    outstanding_debt_ratio: float = Field(..., ge=0)
    has_insurance_history: bool
    
    # Weather
    rainfall_deficit_percent: float
    actual_rainfall_mm: float = Field(..., ge=0)
    heatwave_days: int = Field(..., ge=0)
    avg_temperature_c: Optional[float] = None
    monsoon_reliability: float = Field(..., ge=0, le=1)
    
    # Satellite/Soil
    ndvi_score: float = Field(..., ge=0, le=1)
    soil_moisture_percent: float = Field(..., ge=0, le=100)
    soil_fertility_index: float = Field(..., ge=0, le=1)

class PredictionOutput(BaseModel):
    farmer_id: Optional[str]
    risk_score: int
    risk_category: str
    category_label: str
    claim_probability: float
    confidence: str
    breakdown: Dict[str, int]
    top_risk_drivers: Optional[List[Dict[str, float]]] = None
    top_protective_factors: Optional[List[Dict[str, float]]] = None

class PredictionResponse(BaseModel):
    success: bool
    data: Optional[PredictionOutput] = None
    error: Optional[str] = None

class BatchPredictionRequest(BaseModel):
    inputs: List[PredictionInput]

class HealthResponse(BaseModel):
    status: str
    message: str
    model_loaded: bool

# === ENDPOINTS ===

@app.get("/", response_model=HealthResponse)
async def root():
    return {
        "status": "running",
        "message": "AgriRisk Pro ML API",
        "model_loaded": model is not None
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "healthy" if model is not None else "unhealthy",
        "message": "Model loaded" if model is not None else "Model not loaded",
        "model_loaded": model is not None
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(input_data: PredictionInput):
    """
    Single farm risk prediction
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Convert Pydantic model to dict
        farm_dict = input_data.model_dump()
        
        # Predict
        result = model.predict_risk_score(farm_dict)
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        print(f"Prediction error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/predict/batch")
async def predict_batch(request: BatchPredictionRequest):
    """
    Batch prediction for multiple farms
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        results = []
        for input_data in request.inputs:
            farm_dict = input_data.model_dump()
            result = model.predict_risk_score(farm_dict)
            results.append(result)
        
        return {
            "success": True,
            "data": results
        }
        
    except Exception as e:
        print(f"Batch prediction error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/model/info")
async def model_info():
    """
    Get model metadata
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "metrics": model.metrics,
        "feature_count": len(model.feature_names),
        "categorical_features": model.categorical_features,
        "top_features": sorted(
            model.feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
    }

# === RUN SERVER ===

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)