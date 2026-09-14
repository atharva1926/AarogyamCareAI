import type { HealthProfile, ReportAnalysis } from '../types'
import { AppError, apiGet, apiPost, apiPut, apiUpload } from './api'

const MAX_REPORT_SIZE_BYTES = 10 * 1024 * 1024
const SUPPORTED_REPORT_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg'])

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new AppError('Unable to read the selected report.'))
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const base64 = result.split(',')[1]
      if (!base64) {
        reject(new AppError('Unable to read the selected report.'))
        return
      }
      resolve(base64)
    }
    reader.readAsDataURL(file)
  })
}

export async function uploadReport(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ id: string; name: string }> {
  const form = new FormData()
  form.append('file', file)
  return apiUpload('/api/reports/upload', form, onProgress)
}

export async function analyzeReport(file: File): Promise<ReportAnalysis> {
  if (!SUPPORTED_REPORT_TYPES.has(file.type)) {
    throw new AppError('Please choose a PDF, PNG, or JPG report.')
  }
  if (file.size > MAX_REPORT_SIZE_BYTES) {
    throw new AppError('Please choose a report smaller than 10 MB.')
  }

  return apiPost<ReportAnalysis>('/api/reports/analyze', {
    fileName: file.name,
    mimeType: file.type,
    data: await readFileAsBase64(file),
  })
}

export async function analyzeImage(file: File): Promise<ReportAnalysis> {
  const form = new FormData()
  form.append('file', file)
  return apiUpload<ReportAnalysis>('/api/images/analyze', form)
}

export async function fetchHealthProfile(): Promise<HealthProfile> {
  return apiGet<HealthProfile>('/api/health-profile')
}

export async function saveHealthProfile(profile: HealthProfile): Promise<HealthProfile> {
  return apiPut<HealthProfile>('/api/health-profile', profile)
}
