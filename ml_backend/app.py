"""FastAPI service for the educational disease-prediction module."""

from contextlib import asynccontextmanager
from typing import Annotated, Literal

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from disease_prediction.predict import ModelNotReadyError, PredictionError, get_predictor
from risk_prediction.predict import RiskModelNotReadyError, RiskPredictionError, get_risk_predictor


EDUCATIONAL_MESSAGE = (
    "This is an ML-based educational prediction and not a medical diagnosis. "
    "Please consult a qualified healthcare professional for diagnosis or treatment."
)


class DiseasePredictionRequest(BaseModel):
    symptoms: Annotated[list[str], Field(min_length=1, max_length=30)]


class DiseasePredictionResponse(BaseModel):
    prediction: str
    confidence: float
    message: str


class RiskPredictionRequest(BaseModel):
    """User-facing units are years, cm, kg, and mmHg; categories follow the source dataset."""

    age: Annotated[float, Field(ge=18, le=120)]
    gender: Literal["female", "male"]
    height: Annotated[float, Field(ge=80, le=250)]
    weight: Annotated[float, Field(ge=20, le=300)]
    systolic_bp: Annotated[float, Field(ge=60, le=300)]
    diastolic_bp: Annotated[float, Field(ge=30, le=200)]
    cholesterol: Literal[1, 2, 3]
    glucose: Literal[1, 2, 3]
    smoking: bool
    alcohol: bool
    physical_activity: bool


class RiskPredictionResponse(BaseModel):
    risk_level: Literal["Lower Risk", "Higher Risk"]
    prediction: Literal[0, 1]
    probability: float
    model: str
    message: str


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Load the saved artifact once at startup. The request handler never retrains a model.
    try:
        get_predictor()
    except ModelNotReadyError as error:
        print(f"Disease prediction model is not ready: {error}")
    try:
        get_risk_predictor()
    except RiskModelNotReadyError as error:
        print(f"Health risk prediction model is not ready: {error}")
    yield


app = FastAPI(
    title="AarogyamCareAI ML Prediction API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.exception_handler(RequestValidationError)
async def request_validation_error(_: object, error: RequestValidationError) -> JSONResponse:
    """Keep invalid client payloads concise and safe for the React error UI."""
    fields = [str(item["loc"][-1]) for item in error.errors()[:5] if item.get("loc")]
    suffix = f" Missing or invalid field(s): {', '.join(fields)}." if fields else ""
    return JSONResponse(
        status_code=422,
        content={"detail": f"Invalid request. Please review the supplied values.{suffix}"},
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/symptoms")
def available_symptoms() -> dict[str, list[str]]:
    """Expose only the symptom choices accepted by the saved model."""
    try:
        return {"symptoms": get_predictor().available_symptoms}
    except ModelNotReadyError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/predict-disease", response_model=DiseasePredictionResponse)
def predict_disease(request: DiseasePredictionRequest) -> DiseasePredictionResponse:
    cleaned_symptoms = [symptom.strip() for symptom in request.symptoms if symptom.strip()]
    if not cleaned_symptoms:
        raise HTTPException(status_code=400, detail="Please select at least one symptom.")

    try:
        prediction, confidence = get_predictor().predict(cleaned_symptoms)
        return DiseasePredictionResponse(
            prediction=prediction,
            confidence=confidence,
            message=EDUCATIONAL_MESSAGE,
        )
    except ModelNotReadyError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except PredictionError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception:
        # Keep implementation details and stack traces on the server.
        raise HTTPException(
            status_code=500,
            detail="The prediction could not be completed. Please try again later.",
        ) from None


@app.post("/predict-risk", response_model=RiskPredictionResponse)
def predict_risk(request: RiskPredictionRequest) -> RiskPredictionResponse:
    """Return an educational ML risk category, never a medical diagnosis."""
    if request.systolic_bp <= request.diastolic_bp:
        raise HTTPException(
            status_code=400,
            detail="Systolic blood pressure should be greater than diastolic blood pressure.",
        )

    # These mappings follow the source dataset: gender 1=female, 2=male;
    # binary lifestyle values use 0=no and 1=yes. BMI is modelled explicitly.
    values = {
        "age_years": request.age,
        "height": request.height,
        "weight": request.weight,
        "systolic_bp": request.systolic_bp,
        "diastolic_bp": request.diastolic_bp,
        "bmi": request.weight / (request.height / 100) ** 2,
        "gender": 1 if request.gender == "female" else 2,
        "cholesterol": request.cholesterol,
        "glucose": request.glucose,
        "smoking": int(request.smoking),
        "alcohol": int(request.alcohol),
        "physical_activity": int(request.physical_activity),
    }
    try:
        prediction, score = get_risk_predictor().predict(values)
        return RiskPredictionResponse(
            risk_level="Higher Risk" if prediction == 1 else "Lower Risk",
            prediction=prediction,
            probability=round(score, 4),
            model=get_risk_predictor().model_name,
            message=(
                "This is an ML-based educational risk estimate, not a medical diagnosis. "
                "The model score is not a calibrated medical probability and should not guide treatment."
            ),
        )
    except RiskModelNotReadyError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except RiskPredictionError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="The health risk prediction could not be completed. Please try again later.",
        ) from None
