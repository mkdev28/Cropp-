import uvicorn
import os
import sys

if __name__ == "__main__":
    print("🚀 Starting AgriRisk ML Server...")
    
    # Check if model exists
    if not os.path.exists("models/agri_risk_model_v3.pkl"):
        print("⚠️ WARNING: Model file not found in 'models/' folder.")
        print("   Please run 'python3 ml/setup_pipeline.py' first!")
    
    # Run the server
    # This tells uvicorn to look inside folder 'ml', file 'api_server', variable 'app'
    uvicorn.run("ml.api_server:app", host="0.0.0.0", port=8000, reload=True)