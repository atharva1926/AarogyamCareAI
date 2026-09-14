"""Train and evaluate the disease prediction classifiers.

Run from the ml_backend directory:
    py -m disease_prediction.train
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.tree import DecisionTreeClassifier


RANDOM_STATE = 42
PACKAGE_DIR = Path(__file__).resolve().parent
DATASET_PATH = PACKAGE_DIR / "dataset" / "disease_dataset.csv"
MODEL_PATH = PACKAGE_DIR / "disease_model.pkl"
ENCODER_PATH = PACKAGE_DIR / "label_encoder.pkl"
FEATURES_PATH = PACKAGE_DIR / "feature_names.json"
METRICS_PATH = PACKAGE_DIR / "evaluation_results.json"


def load_dataset() -> tuple[pd.DataFrame, pd.Series]:
    """Load the public dataset and prepare binary symptom features and labels."""
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset file was not found: {DATASET_PATH}")

    data = pd.read_csv(DATASET_PATH)
    # The source CSV has whitespace around some headings/labels and a trailing empty column.
    data.columns = [str(column).strip() for column in data.columns]
    data = data.loc[:, ~data.columns.str.contains(r"^Unnamed")]
    if "prognosis" not in data.columns:
        raise ValueError("The dataset must contain a 'prognosis' target column.")

    labels = data.pop("prognosis").astype(str).str.strip()
    if labels.isna().any() or labels.eq("").any():
        raise ValueError("The dataset contains missing target labels.")

    # Features already represent symptom absence/presence. Fill missing values before splitting.
    features = data.apply(pd.to_numeric, errors="coerce").fillna(0).astype("int8")
    if features.empty:
        raise ValueError("The dataset does not contain symptom feature columns.")
    return features, labels


def metric_summary(y_true, y_pred) -> dict[str, float]:
    report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
    macro = report["macro avg"]
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(macro["precision"]), 4),
        "recall": round(float(macro["recall"]), 4),
        "f1_score": round(float(macro["f1-score"]), 4),
    }


def print_evaluation(name: str, metrics: dict[str, float], matrix, class_labels: list[str]) -> None:
    print(f"\n{name}")
    print("-" * len(name))
    for metric, value in metrics.items():
        print(f"{metric.replace('_', ' ').title()}: {value:.4f}")
    print("Confusion matrix (rows = actual, columns = predicted):")
    print(pd.DataFrame(matrix, index=class_labels, columns=class_labels))


def choose_model(
    models: dict[str, object], metrics: dict[str, dict[str, float]]
) -> str:
    """Choose by macro F1 first, then accuracy; favor the primary RF only on an exact tie."""
    ranked = sorted(
        models,
        key=lambda name: (
            metrics[name]["f1_score"],
            metrics[name]["accuracy"],
            name == "random_forest",
        ),
        reverse=True,
    )
    return ranked[0]


def main() -> None:
    features, labels = load_dataset()
    label_encoder = LabelEncoder()
    encoded_labels = label_encoder.fit_transform(labels)

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        encoded_labels,
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=encoded_labels,
    )

    models = {
        "decision_tree": DecisionTreeClassifier(random_state=RANDOM_STATE),
        "random_forest": RandomForestClassifier(
            n_estimators=300,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
    }
    metrics: dict[str, dict[str, float]] = {}
    matrices: dict[str, list[list[int]]] = {}

    for name, model in models.items():
        model.fit(x_train, y_train)
        predictions = model.predict(x_test)
        metrics[name] = metric_summary(y_test, predictions)
        matrices[name] = confusion_matrix(y_test, predictions).tolist()
        print_evaluation(
            name.replace("_", " ").title(),
            metrics[name],
            matrices[name],
            label_encoder.classes_.tolist(),
        )

    selected_name = choose_model(models, metrics)
    selected_model = models[selected_name]
    joblib.dump(selected_model, MODEL_PATH)
    joblib.dump(label_encoder, ENCODER_PATH)
    FEATURES_PATH.write_text(json.dumps(features.columns.tolist(), indent=2), encoding="utf-8")
    METRICS_PATH.write_text(
        json.dumps(
            {
                "dataset_rows": len(features),
                "symptom_features": len(features.columns),
                "condition_classes": len(label_encoder.classes_),
                "condition_labels": label_encoder.classes_.tolist(),
                "random_state": RANDOM_STATE,
                "selection_metric": "macro F1-score, then accuracy",
                "selected_model": selected_name,
                "metrics": metrics,
                "confusion_matrices": matrices,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"\nSelected model: {selected_name}")
    print(f"Saved model: {MODEL_PATH}")
    print(f"Saved evaluation results: {METRICS_PATH}")


if __name__ == "__main__":
    main()
