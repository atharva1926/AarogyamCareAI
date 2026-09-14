# Module 3 — Cardiovascular Health Risk Prediction

## Purpose and safety

This module provides an **ML-based educational cardiovascular risk estimate**. It assigns supplied data to the lower-risk or higher-risk class learned from the training data. It does **not** diagnose cardiovascular disease, recommend medicine, or replace a qualified clinician.

The response `probability` is a model score from `predict_proba`; it is not a calibrated clinical probability and must not be used for treatment decisions.

## Dataset

- Canonical public source: [OpenML dataset 45547 — Cardiovascular-Disease-dataset](https://www.openml.org/search?type=data&status=active&id=45547)
- Original citation supplied by OpenML: [Kaggle Cardiovascular Disease Dataset](https://www.kaggle.com/datasets/sulianova/cardiovascular-disease-dataset)
- Local training file: `dataset/cardiovascular.csv` (70,000 rows, 12 columns)
- Target: `cardio`: 0 = no cardiovascular disease recorded; 1 = cardiovascular disease recorded in the source data.

The data combines objective measurements, examination values, and self-reported lifestyle information recorded at examination time. It is not a general-population clinical-risk calculator.

## Features and mappings

| Application field | Dataset/model field | Mapping |
| --- | --- | --- |
| Age in years | `age_years` | Dataset days ÷ 365.25 |
| Height/weight | `height`, `weight` | cm and kg |
| Body mass index | `bmi` | `weight / (height / 100)^2` |
| Blood pressure | `systolic_bp`, `diastolic_bp` | Dataset `ap_hi`, `ap_lo`, mmHg |
| Gender | `gender` | Female = 1; Male = 2 |
| Cholesterol | `cholesterol` | 1 = normal; 2 = above normal; 3 = high |
| Glucose | `glucose` | 1 = normal; 2 = above normal; 3 = high |
| Smoking/alcohol/activity | `smoking`, `alcohol`, `physical_activity` | No = 0; Yes = 1 |

## Preprocessing and feature engineering

`train.py` loads the CSV with pandas, prints data types and source inspection, checks missing values and duplicate rows, coerces numeric fields, removes duplicates, and removes clear invalid data-entry records. The source had zero missing values and 24 exact duplicates. The reproducible run retained 68,613 records from 70,000 after enforcing plausible height, weight, pressure, category values, and systolic pressure greater than diastolic pressure.

BMI is the only derived feature. It is calculated from height and weight; the source does not already provide it.

The train/test split is 80/20, stratified, with `random_state=42`. Each sklearn Pipeline owns its ColumnTransformer: numeric values are median-imputed and standardized for Logistic Regression; categorical values are most-frequent imputed and one-hot encoded. All transforms are fitted only on the training partition, avoiding leakage. The selected complete pipeline is saved as `risk_model.pkl`; FastAPI never retrains it.

## Models and actual evaluation

Both requested classifiers were trained and evaluated on the same held-out 13,723-record test split. Positive-class metrics treat `cardio=1` as the higher-risk class. Confusion-matrix order is `[[TN, FP], [FN, TP]]`.

| Model | Accuracy | Precision | Recall | F1-score | ROC-AUC | False negatives |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Logistic Regression | 0.7314 | 0.7588 | 0.6703 | 0.7118 | 0.7951 | 2,239 |
| Random Forest Classifier | 0.7372 | 0.7578 | 0.6890 | 0.7217 | 0.8038 | 2,112 |

- Logistic Regression matrix: `[[5486, 1447], [2239, 4551]]`
- Random Forest matrix: `[[5438, 1495], [2112, 4678]]`

The selected model is **Random Forest Classifier**. Selection prioritizes positive-class recall (sensitivity), then F1-score and ROC-AUC—not accuracy alone. In this run it found more high-risk-labelled records and had 127 fewer false negatives than Logistic Regression.

For basic interpretability, `evaluation_results.json` saves Logistic Regression coefficients and Random Forest impurity importances. In this run, systolic pressure, diastolic pressure, age, BMI, and cholesterol categories were among the forest's influential model features. This describes model behaviour in this dataset; it does not establish a cause for an individual.

## API and frontend flow

`React form → riskPredictionService → POST /predict-risk → saved sklearn pipeline → JSON response → result card`

The API validates values with Pydantic, maps readable fields to documented dataset encodings, calculates BMI, and sends a one-row DataFrame to the saved pipeline. Invalid requests receive clean HTTP errors; unavailable models return HTTP 503 without stack traces.

Example request:

```json
{
  "age": 45,
  "gender": "male",
  "height": 175,
  "weight": 82,
  "systolic_bp": 140,
  "diastolic_bp": 90,
  "cholesterol": 2,
  "glucose": 1,
  "smoking": true,
  "alcohol": false,
  "physical_activity": true
}
```

## Run commands

From the project root, install Python dependencies once, then train and run:

```powershell
py -m pip install -r ml_backend/requirements.txt
npm run ml:train-risk
npm run ml:server
npm run dev
```

If the Windows `py` launcher is not configured, activate or use an installed Python environment first.

## Limitations

- This is a retrospective binary-classification exercise, not a validated clinical prediction rule.
- Data provenance, demographic coverage, measurement practices, and self-reported lifestyle fields limit generalizability.
- It omits important clinical context, medical history, lab detail, and clinician assessment.
- A model score must not be treated as certainty or a treatment direction.
