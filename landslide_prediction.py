from collections.abc import Sequence

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler


class LandslidePredictionEngine:
    """Small, deterministic classifier suitable for the demo API."""

    def __init__(self) -> None:
        self.model = RandomForestClassifier(n_estimators=50, random_state=42)
        self.scaler = StandardScaler()
        self.is_fitted = False

    def fit(self, features: Sequence[Sequence[float]], labels: Sequence[int]) -> None:
        X = np.asarray(features, dtype=float)
        y = np.asarray(labels, dtype=int)
        if X.ndim != 2 or len(X) != len(y) or len(X) < 2:
            raise ValueError("features and labels must contain at least two matching rows")
        self.model.fit(self.scaler.fit_transform(X), y)
        self.is_fitted = True

    def predict(self, features: Sequence[Sequence[float]]) -> list[int]:
        if not self.is_fitted:
            raise RuntimeError("Prediction engine has not been trained")
        X = np.asarray(features, dtype=float)
        if X.ndim == 1:
            X = X.reshape(1, -1)
        return self.model.predict(self.scaler.transform(X)).astype(int).tolist()
