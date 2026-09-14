"""Load the saved prediction artifacts and convert selected symptoms to feature vectors."""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np
import pandas as pd


PACKAGE_DIR = Path(__file__).resolve().parent
MODEL_PATH = PACKAGE_DIR / "disease_model.pkl"
ENCODER_PATH = PACKAGE_DIR / "label_encoder.pkl"
FEATURES_PATH = PACKAGE_DIR / "feature_names.json"


class ModelNotReadyError(Exception):
    """Raised when training artifacts are not available yet."""


class PredictionError(Exception):
    """Raised for a user input that cannot be converted to model features."""


def normalise_symptom(value: str) -> str:
    """Make source column names and UI labels compare consistently."""
    value = re.sub(r"\.\d+$", "", value.strip().lower())
    return re.sub(r"[\s_\-]+", " ", value).strip()


def display_symptom(value: str) -> str:
    return normalise_symptom(value).replace("(", "(").title()


class DiseasePredictor:
    def __init__(self) -> None:
        missing = [path.name for path in (MODEL_PATH, ENCODER_PATH, FEATURES_PATH) if not path.exists()]
        if missing:
            raise ModelNotReadyError(
                "The disease prediction model has not been trained yet. "
                "Run 'py -m disease_prediction.train' from the ml_backend folder."
            )

        self.model = joblib.load(MODEL_PATH)
        self.label_encoder = joblib.load(ENCODER_PATH)
        self.feature_names: list[str] = json.loads(FEATURES_PATH.read_text(encoding="utf-8"))
        self.symptom_lookup: dict[str, list[str]] = {}
        for feature in self.feature_names:
            self.symptom_lookup.setdefault(normalise_symptom(feature), []).append(feature)
        self.available_symptoms = sorted(self.symptom_lookup)

    def predict(self, symptoms: list[str]) -> tuple[str, float]:
        normalised = {normalise_symptom(symptom) for symptom in symptoms if symptom.strip()}
        unknown = sorted(symptom for symptom in normalised if symptom not in self.symptom_lookup)
        if unknown:
            raise PredictionError(f"Unknown symptom(s): {', '.join(unknown)}.")
        if not normalised:
            raise PredictionError("Please select at least one symptom.")

        vector = np.zeros(len(self.feature_names), dtype=np.int8)
        for selected in normalised:
            for feature in self.symptom_lookup[selected]:
                vector[self.feature_names.index(feature)] = 1
        input_frame = pd.DataFrame([vector], columns=self.feature_names)
        encoded_prediction = self.model.predict(input_frame)[0]
        prediction = str(self.label_encoder.inverse_transform([encoded_prediction])[0])

        if not hasattr(self.model, "predict_proba"):
            raise PredictionError("The selected model does not support probability estimates.")
        probabilities = self.model.predict_proba(input_frame)[0]
        confidence = float(np.max(probabilities))
        return prediction, confidence


@lru_cache(maxsize=1)
def get_predictor() -> DiseasePredictor:
    return DiseasePredictor()
