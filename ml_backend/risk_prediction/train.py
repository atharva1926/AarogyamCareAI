"""Train and evaluate cardiovascular health-risk classification models.

Run from ``ml_backend`` with ``py -m risk_prediction.train``.  Training is
deliberately separate from FastAPI so API requests only load a saved pipeline.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


RANDOM_STATE = 42
PACKAGE_DIR = Path(__file__).resolve().parent
DATASET_PATH = PACKAGE_DIR / "dataset" / "cardiovascular.csv"
MODEL_PATH = PACKAGE_DIR / "risk_model.pkl"
METRICS_PATH = PACKAGE_DIR / "evaluation_results.json"
METADATA_PATH = PACKAGE_DIR / "metadata.json"

# ``age`` is converted to years for both training and prediction.  BMI adds a
# useful height/weight relationship without removing the original measurements.
NUMERIC_FEATURES = ["age_years", "height", "weight", "systolic_bp", "diastolic_bp", "bmi"]
CATEGORICAL_FEATURES = ["gender", "cholesterol", "glucose", "smoking", "alcohol", "physical_activity"]
FEATURE_COLUMNS = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def load_and_clean_dataset() -> tuple[pd.DataFrame, pd.Series, dict[str, int]]:
    """Load the public dataset, inspect it, and remove clearly invalid records."""
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Dataset file was not found: {DATASET_PATH}. See risk_prediction/README.md."
        )

    raw = pd.read_csv(DATASET_PATH)
    raw.columns = raw.columns.str.strip().str.lower()
    required = {
        "age", "gender", "height", "weight", "ap_hi", "ap_lo", "cholesterol",
        "gluc", "smoke", "alco", "active", "cardio",
    }
    missing = required.difference(raw.columns)
    if missing:
        raise ValueError(f"Dataset is missing required columns: {', '.join(sorted(missing))}")

    inspection = {
        "source_rows": int(len(raw)),
        "source_columns": int(len(raw.columns)),
        "missing_values_before_cleaning": int(raw.isna().sum().sum()),
        "duplicate_rows_before_cleaning": int(raw.duplicated().sum()),
    }
    print("Dataset inspection:")
    print(raw.info())
    print(f"Missing values: {inspection['missing_values_before_cleaning']}")
    print(f"Duplicate rows: {inspection['duplicate_rows_before_cleaning']}")

    # The published data is numeric. Coercion makes the handling explicit if a
    # later source revision contains malformed values.
    # Keep an explicit order; set iteration is intentionally not used for a
    # training frame because it would make the source-column order unstable.
    source_columns = [
        "age", "gender", "height", "weight", "ap_hi", "ap_lo", "cholesterol",
        "gluc", "smoke", "alco", "active", "cardio",
    ]
    data = raw[source_columns].apply(pd.to_numeric, errors="coerce")
    data = data.drop_duplicates()
    data = data.dropna()

    # Remove records that are clearly data-entry errors (for example, ap_lo=1000).
    valid = (
        data["age"].between(18 * 365, 120 * 365)
        & data["height"].between(100, 230)
        & data["weight"].between(30, 200)
        & data["ap_hi"].between(70, 250)
        & data["ap_lo"].between(40, 180)
        & (data["ap_hi"] > data["ap_lo"])
        & data["gender"].isin([1, 2])
        & data["cholesterol"].isin([1, 2, 3])
        & data["gluc"].isin([1, 2, 3])
        & data[["smoke", "alco", "active", "cardio"]].isin([0, 1]).all(axis=1)
    )
    data = data.loc[valid].copy()
    inspection["rows_after_cleaning"] = int(len(data))
    inspection["rows_removed"] = inspection["source_rows"] - inspection["rows_after_cleaning"]

    features = pd.DataFrame(
        {
            "age_years": data["age"] / 365.25,
            "height": data["height"],
            "weight": data["weight"],
            "systolic_bp": data["ap_hi"],
            "diastolic_bp": data["ap_lo"],
            "bmi": data["weight"] / (data["height"] / 100) ** 2,
            "gender": data["gender"].astype(int),
            "cholesterol": data["cholesterol"].astype(int),
            "glucose": data["gluc"].astype(int),
            "smoking": data["smoke"].astype(int),
            "alcohol": data["alco"].astype(int),
            "physical_activity": data["active"].astype(int),
        }
    )
    target = data["cardio"].astype(int)
    return features, target, inspection


def make_preprocessor(scale_numeric: bool) -> ColumnTransformer:
    numeric_steps: list[tuple[str, Any]] = [("imputer", SimpleImputer(strategy="median"))]
    if scale_numeric:
        # Fitted only when the containing pipeline is fitted on X_train.
        numeric_steps.append(("scaler", StandardScaler()))
    return ColumnTransformer(
        transformers=[
            ("numeric", Pipeline(numeric_steps), NUMERIC_FEATURES),
            (
                "categorical",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                CATEGORICAL_FEATURES,
            ),
        ]
    )


def build_models() -> dict[str, Pipeline]:
    return {
        "logistic_regression": Pipeline(
            [
                ("preprocessor", make_preprocessor(scale_numeric=True)),
                ("model", LogisticRegression(max_iter=2000, random_state=RANDOM_STATE)),
            ]
        ),
        "random_forest": Pipeline(
            [
                ("preprocessor", make_preprocessor(scale_numeric=False)),
                (
                    "model",
                    RandomForestClassifier(
                        # Depth and leaf limits keep the comparison reproducible
                        # and the saved academic-project artifact practical to load.
                        n_estimators=200,
                        max_depth=12,
                        min_samples_leaf=10,
                        random_state=RANDOM_STATE,
                        n_jobs=-1,
                        class_weight="balanced",
                    ),
                ),
            ]
        ),
    }


def evaluate_model(model: Pipeline, x_test: pd.DataFrame, y_test: pd.Series) -> dict[str, Any]:
    predictions = model.predict(x_test)
    probabilities = model.predict_proba(x_test)[:, 1]
    matrix = confusion_matrix(y_test, predictions, labels=[0, 1])
    return {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "precision": round(float(precision_score(y_test, predictions, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, predictions, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_test, predictions, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, probabilities)), 4),
        "confusion_matrix": matrix.tolist(),
        "false_negatives": int(matrix[1, 0]),
    }


def transformed_feature_importance(model: Pipeline, model_name: str) -> list[dict[str, float | str]]:
    names = model.named_steps["preprocessor"].get_feature_names_out().tolist()
    estimator = model.named_steps["model"]
    if model_name == "logistic_regression":
        values = estimator.coef_[0]
        ranked = sorted(zip(names, values), key=lambda item: abs(item[1]), reverse=True)
        return [
            {"feature": str(name), "coefficient": round(float(value), 5), "absolute_importance": round(abs(float(value)), 5)}
            for name, value in ranked[:10]
        ]
    ranked = sorted(zip(names, estimator.feature_importances_), key=lambda item: item[1], reverse=True)
    return [
        {"feature": str(name), "importance": round(float(value), 5)}
        for name, value in ranked[:10]
    ]


def choose_model(metrics: dict[str, dict[str, Any]]) -> str:
    """Prioritise sensitivity, then F1 and ROC-AUC for this binary risk task."""
    return max(
        metrics,
        key=lambda name: (
            metrics[name]["recall"],
            metrics[name]["f1_score"],
            metrics[name]["roc_auc"],
        ),
    )


def main() -> None:
    features, target, inspection = load_and_clean_dataset()
    x_train, x_test, y_train, y_test = train_test_split(
        features,
        target,
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=target,
    )

    models = build_models()
    metrics: dict[str, dict[str, Any]] = {}
    importances: dict[str, list[dict[str, float | str]]] = {}
    for name, model in models.items():
        model.fit(x_train, y_train)
        metrics[name] = evaluate_model(model, x_test, y_test)
        importances[name] = transformed_feature_importance(model, name)
        print(f"\n{name.replace('_', ' ').title()}: {metrics[name]}")
        print(f"Top influential transformed features: {importances[name][:5]}")

    selected_name = choose_model(metrics)
    selected_model = models[selected_name]
    display_names = {"logistic_regression": "Logistic Regression", "random_forest": "Random Forest Classifier"}
    joblib.dump(selected_model, MODEL_PATH)
    results = {
        "dataset": "OpenML dataset 45547 (Cardiovascular-Disease-dataset)",
        "inspection": inspection,
        "features": FEATURE_COLUMNS,
        "target": "cardio (0 = no cardiovascular disease recorded, 1 = cardiovascular disease recorded)",
        "random_state": RANDOM_STATE,
        "test_size": 0.2,
        "selection_criterion": "highest positive-class recall, then F1-score, then ROC-AUC",
        "metrics": metrics,
        "feature_importance": importances,
        "selected_model": selected_name,
        "selected_model_display_name": display_names[selected_name],
    }
    METRICS_PATH.write_text(json.dumps(results, indent=2), encoding="utf-8")
    METADATA_PATH.write_text(
        json.dumps(
            {
                "model": display_names[selected_name],
                "selected_model": selected_name,
                "features": FEATURE_COLUMNS,
                "training_rows": len(x_train),
                "test_rows": len(x_test),
                "selection_criterion": results["selection_criterion"],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"\nSelected model: {display_names[selected_name]}")
    print(f"Saved complete pipeline: {MODEL_PATH}")
    print(f"Saved evaluation results: {METRICS_PATH}")


if __name__ == "__main__":
    main()
