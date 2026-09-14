import axios, { type AxiosError } from 'axios'
import { AppError } from './api'
import type { DiseasePredictionResponse, SymptomsResponse } from '../types'

const diseasePredictionClient = axios.create({
  baseURL: import.meta.env.VITE_ML_API_URL ?? 'http://localhost:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

function diseasePredictionError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string; message?: string }>
    if (!axiosError.response) {
      return new AppError(
        'Disease prediction is unavailable. Please make sure the ML backend is running.',
      )
    }
    const message = axiosError.response.data?.detail ?? axiosError.response.data?.message
    return new AppError(
      message || 'The prediction could not be completed. Please try again.',
      axiosError.response.status,
    )
  }
  return new AppError('The prediction could not be completed. Please try again.')
}

export async function fetchAvailableSymptoms(): Promise<string[]> {
  try {
    const response = await diseasePredictionClient.get<SymptomsResponse>('/symptoms')
    if (!Array.isArray(response.data.symptoms)) {
      throw new AppError('The ML backend returned an invalid symptom list.')
    }
    return response.data.symptoms
  } catch (error) {
    throw diseasePredictionError(error)
  }
}

export async function predictDisease(symptoms: string[]): Promise<DiseasePredictionResponse> {
  try {
    const response = await diseasePredictionClient.post<DiseasePredictionResponse>('/predict-disease', {
      symptoms,
    })
    const result = response.data
    if (!result.prediction || typeof result.confidence !== 'number' || !result.message) {
      throw new AppError('The ML backend returned an invalid prediction result.')
    }
    return result
  } catch (error) {
    throw diseasePredictionError(error)
  }
}
