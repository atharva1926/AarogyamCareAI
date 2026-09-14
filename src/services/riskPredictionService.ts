import axios, { type AxiosError } from 'axios'
import { AppError } from './api'
import type { RiskPredictionRequest, RiskPredictionResponse } from '../types'

const riskPredictionClient = axios.create({
  baseURL: import.meta.env.VITE_ML_API_URL ?? 'http://localhost:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

function riskPredictionError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string; message?: string }>
    if (!axiosError.response) {
      return new AppError('Health risk prediction is unavailable. Please make sure the ML backend is running.')
    }
    return new AppError(
      axiosError.response.data?.detail ?? axiosError.response.data?.message ??
        'The health risk estimate could not be completed. Please try again.',
      axiosError.response.status,
    )
  }
  return new AppError('The health risk estimate could not be completed. Please try again.')
}

export async function predictHealthRisk(request: RiskPredictionRequest): Promise<RiskPredictionResponse> {
  try {
    const response = await riskPredictionClient.post<RiskPredictionResponse>('/predict-risk', request)
    const result = response.data
    if (
      !['Lower Risk', 'Higher Risk'].includes(result.risk_level) ||
      ![0, 1].includes(result.prediction) ||
      typeof result.probability !== 'number' ||
      !Number.isFinite(result.probability) ||
      typeof result.model !== 'string' ||
      typeof result.message !== 'string'
    ) {
      throw new AppError('The ML backend returned an invalid health risk result.')
    }
    return result
  } catch (error) {
    throw riskPredictionError(error)
  }
}
