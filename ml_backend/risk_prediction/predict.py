"""Load the saved cardiovascular-risk pipeline for FastAPI prediction requests."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd


PACKAGE_DIR = Path(__file__).resolve().parent
MODEL_PATH = PACKAGE_DIR / "risk_model.pkl"
METADATA_PATH = PACKAGE_DIR / "metadata.json"


class RiskModelNotReadyError(Exception):
    """Raised when risk model training artifacts do not exist."""


class RiskPredictionError(Exception):
    """Raised when a prediction cannot be generated safely."""


class RiskPredictor:
    def __init__(self) -> None:
        missing = [path.name for path in (MODEL_PATH, METADATA_PATH) if not path.exists()]
        if missing:
            raise RiskModelNotReadyError(
                "The health risk model has not been trained yet. Run 'py -m risk_prediction.train' from ml_backend."
            )
        self.model = joblib.load(MODEL_PATH)
        self.metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))

    @property
    def model_name(self) -> str:
        return str(self.metadata["model"])

    def predict(self, values: dict[str, float | int]) -> tuple[int, float]:
        try:
            frame = pd.DataFrame([values])
            prediction = int(self.model.predict(frame)[0])
            if not hasattr(self.model, "predict_proba"):
                raise RiskPredictionError("The saved model does not provide a model score.")
            score = float(self.model.predict_proba(frame)[0][1])
            return prediction, score
        except RiskPredictionError:
            raise
        except Exception as error:
            raise RiskPredictionError("The supplied values could not be evaluated by the risk model.") from error


@lru_cache(maxsize=1)
def get_risk_predictor() -> RiskPredictor:
    return RiskPredictor()
