import axios, { AxiosError, type AxiosInstance } from 'axios'

export class AppError extends Error {
  status?: number

  constructor(userMessage: string, status?: number) {
    super(userMessage)
    this.name = 'AppError'
    this.status = status
  }
}

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('aarogyamcare.auth')
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { token?: string }
      if (parsed.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`
      }
    } catch {
      /* ignore malformed storage */
    }
  }
  return config
})

function friendlyMessage(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>
    if (!axiosError.response) {
      return new AppError('Unable to connect to the server. Please check your connection.')
    }
    return new AppError(
      axiosError.response.data?.message ??
        'Something went wrong while connecting to AarogyamCare AI. Please try again.',
      axiosError.response.status,
    )
  }
  return new AppError('Something went wrong while connecting to AarogyamCare AI. Please try again.')
}

export async function apiGet<T>(path: string): Promise<T> {
  try {
    const response = await apiClient.get<T>(path)
    return response.data
  } catch (error) {
    throw friendlyMessage(error)
  }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  try {
    const response = await apiClient.post<T>(path, body)
    return response.data
  } catch (error) {
    throw friendlyMessage(error)
  }
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  try {
    const response = await apiClient.put<T>(path, body)
    return response.data
  } catch (error) {
    throw friendlyMessage(error)
  }
}

export async function apiDelete<T>(path: string): Promise<T> {
  try {
    const response = await apiClient.delete<T>(path)
    return response.data
  } catch (error) {
    throw friendlyMessage(error)
  }
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<T> {
  try {
    const response = await apiClient.post<T>(path, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return
        onProgress(Math.round((event.loaded / event.total) * 100))
      },
    })
    return response.data
  } catch (error) {
    throw friendlyMessage(error)
  }
}
