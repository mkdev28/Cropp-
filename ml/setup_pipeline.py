import sys
import os
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

try:
    from ml.data_generator import generate_production_grade_data
    from ml.train_model import ProductionAgriRiskModel
except ImportError as e:
    print(f"❌ Import Error: {e}")
    sys.exit(1)

def main():
    print("="*60)
    print(" 🚜 AGRI-RISK PRO: ML PIPELINE SETUP")
    print("="*60)

    # 1. Directories
    os.makedirs("data", exist_ok=True)
    os.makedirs("models", exist_ok=True)

    # 2. Generate Data
    csv_path = "data/production_farm_insurance_data.csv"
    if not os.path.exists(csv_path):
        print("\n[1/2] Generating Synthetic Data...")
        df = generate_production_grade_data(n_samples=50000)
    else:
        print("\n[1/2] Data exists. Loading...")
        import pandas as pd
        df = pd.read_csv(csv_path)
    
    # 3. Train Model
    print("\n[2/2] Training Model...")
    model = ProductionAgriRiskModel()
    model.train(df, target_col='claim_filed')
    
    # 4. Save
    save_path = "models/agri_risk_model_v3.pkl"
    model.save(save_path)
    print(f"\n✅ Success! Model saved to {save_path}")

if __name__ == "__main__":
    main()