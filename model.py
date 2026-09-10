from sqlalchemy import Column, Date, Float, Integer
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Landslide(Base):
    __tablename__ = "landslides"

    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False)
    area = Column(Float, nullable=False)
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Load preprocessed data
data = pd.read_csv("region_data.csv")

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(data["topography"], data["land_use"], test_size=0.2, random_state=42)

# Train model using Random Forest Classifier
rf_model = RandomForestClassifier(n_estimators=100)
rf_model.fit(X_train, y_train)

# Evaluate model performance on testing set
y_pred = rf_model.predict_proba(X_test)[:, 1]
accuracy = accuracy_score(y_test, y_pred)

print("Model Accuracy:", accuracy)

# Create frontend application using Flask
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict_landslide():
    region_coords = request.json["region_coords"]
    land_use_info = request.json["land_use_info"]

    # Preprocess data and make predictions
    predicted_likelihood = rf_model.predict_proba([region_coords, land_use_info])

    return jsonify({"likelihood": predicted_likelihood[0][1]})

if __name__ == "__main__":
    app.run(debug=True)
# import React from 'react';
# import GlobeView from '@/components/GlobeView';
# import RoutePlanner from '@/components/RoutePlanner';
# export default function HomePage() {
#   return (
#     <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
#       <header className="w-full max-w-4xl mb-4">
#         <h1 className="text-3xl font-bold text-center text-gray-800">
#           GiriRaksha  Landslide Risk Early Warning System
#         </h1>
#       </header>
#       <section className="w-full max-w-4xl flex flex-col md:flex-row gap-4">
#         <div className="flex-1 md:h-[600px] h-[400px] bg-white shadow rounded overflow-hidden">
#           <GlobeView />
#         </div>
#         <div className="flex-1 md:h-[600px] h-[400px] bg-white shadow rounded p-4 overflow-auto">
#           <RoutePlanner />
#         </div>
#       </section>
#       <footer className="mt-8 text-sm text-gray-600">
#         2026 GiriRaksha Team. All rights reserved.
#       </footer>
#     </main>
#   );
# }
